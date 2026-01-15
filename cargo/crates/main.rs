use std::{collections::HashMap, fs, sync::Mutex};

use actix_web::{App, HttpResponse, HttpServer, Responder, middleware, post, web};
use hnsw_rs::{dist::DistCosine, hnsw::Hnsw};
use serde::{Deserialize, Serialize};
use sqlx::{Executor, SqlitePool, prelude::FromRow};

use crate::lib::state::AppState;

mod lib;

const DIM: usize = 768;
const MAX_NB_CONN: usize = 24;
const EF_CONSTRUCTION: usize = 200;

#[derive(Debug, Clone, FromRow, Serialize)]
pub struct Vector {
    pub vector: Vec<f32>,
}

async fn build_hnsw_for_key(pool: &SqlitePool, key: &str) -> Hnsw<f32, DistCosine> {
    let rows: Vec<(i64, Vec<u8>)> = sqlx::query_as("SELECT id, vector FROM vectors WHERE key = ?")
        .bind(key)
        .fetch_all(pool)
        .await
        .unwrap();

    let hnsw = Hnsw::new(
        MAX_NB_CONN,
        10_000, // expected max entries
        DIM,
        EF_CONSTRUCTION,
        DistCosine {},
    );

    for (id_int, bytes) in rows {
        let vector: Vec<f32> = bincode::deserialize(&bytes).unwrap();
        let id = id_int as usize;
        hnsw.insert((&vector, id));
    }

    hnsw
}

#[derive(Deserialize)]
struct ReadHandlerBody {
    key: String,
    id: usize,
}
#[post("/read")]
async fn read_handler(
    body: web::Json<ReadHandlerBody>,
    state: web::Data<AppState>,
) -> impl Responder {
    let key = body.key.clone();
    let id = body.id.clone();

    let vector_bytes: Option<Vec<u8>> =
        sqlx::query_scalar("SELECT vector FROM vectors WHERE key=? AND id=?")
            .bind(&key)
            .bind(&id.to_string())
            .fetch_one(&state.db)
            .await
            .ok();

    let vector = vector_bytes.map(|bytes| bincode::deserialize(&bytes).unwrap());

    HttpResponse::Ok().json(vector.map(|v| Vector { vector: v }))
}

#[derive(Deserialize)]
struct WriteHandlerBody {
    key: String,
    id: usize,
    vector: Vec<f32>,
}
#[post("/write")]
async fn write_handler(
    body: web::Json<WriteHandlerBody>,
    state: web::Data<AppState>,
) -> impl Responder {
    let key = body.key.clone();
    let id = body.id.clone();
    let vector = body.vector.clone();

    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(1) FROM vectors WHERE key=? AND id=?")
        .bind(&key)
        .bind(&id.to_string())
        .fetch_one(&state.db)
        .await
        .unwrap_or(0);

    if exists > 0 {
        let _ = sqlx::query("UPDATE vectors SET vector=? WHERE key=? AND id=?")
            .bind(&bincode::serialize(&vector).unwrap())
            .bind(&key)
            .bind(&id.to_string())
            .execute(&state.db)
            .await;

        let hnsw = build_hnsw_for_key(&state.db, &key).await;
        state.hnsw_map.lock().unwrap().insert(key.clone(), hnsw);
    } else {
        let _ = sqlx::query("INSERT INTO vectors (key, id, vector) VALUES (?, ?, ?)")
            .bind(&key)
            .bind(&id.to_string())
            .bind(&bincode::serialize(&vector).unwrap())
            .execute(&state.db)
            .await;
    }

    HttpResponse::Ok().body("OK")
}

#[derive(Deserialize)]
struct DeleteHandlerBody {
    key: String,
    id: usize,
}
#[post("/delete")]
async fn delete_handler(
    body: web::Json<DeleteHandlerBody>,
    state: web::Data<AppState>,
) -> impl Responder {
    let key = body.key.clone();
    let id = body.id.clone();

    let _ = sqlx::query("DELETE FROM vectors WHERE key=? AND id=?")
        .bind(&key)
        .bind(&id.to_string())
        .execute(&state.db)
        .await;

    HttpResponse::Ok().body("OK")
}

#[derive(Deserialize)]
struct QueryHandlerBody {
    key: String,
    vector: Vec<f32>,
    k: usize,
}
#[post("/query")]
async fn query_handler(
    body: web::Json<QueryHandlerBody>,
    state: web::Data<AppState>,
) -> impl Responder {
    let key = body.key.clone();
    let vector = body.vector.clone();
    let k = body.k;

    let hnsw_map = state.hnsw_map.lock().unwrap();
    if let Some(hnsw) = hnsw_map.get(&key) {
        let results = hnsw.search(&vector, k, 50);
        let candidates: Vec<_> = results
            .into_iter()
            // .filter(|n| n.distance <= 0.25)
            .map(|n| n.d_id.to_string())
            .collect();
        HttpResponse::Ok().json(candidates)
    } else {
        HttpResponse::Ok().json(Vec::<String>::new())
    }
}

async fn ensure_db_migration(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let sql = fs::read_to_string("crates/db/up.sql").expect("Failed to read SQL file");

    pool.execute(sql.as_str()).await?;
    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let db_url = "sqlite://vector_storage.db";
    let db_path = db_url.strip_prefix("sqlite://").unwrap_or(&db_url);
    if !std::path::Path::new(db_path).exists() {
        println!("Database file '{}' does not exist. Creating it...", db_path);
        std::fs::File::create(db_path).expect("Failed to create database file");
    }

    let db_pool = SqlitePool::connect(&db_url).await.unwrap();

    ensure_db_migration(&db_pool)
        .await
        .expect("Database migration failed");

    let hnsw_map = Mutex::new(HashMap::<String, Hnsw<f32, DistCosine>>::new());

    // Load existing HNSW for each key
    let keys: Vec<String> = sqlx::query_scalar("SELECT DISTINCT key FROM vectors")
        .fetch_all(&db_pool)
        .await
        .unwrap_or_default();

    for key in keys {
        let hnsw = build_hnsw_for_key(&db_pool, &key).await;
        hnsw_map.lock().unwrap().insert(key, hnsw);
    }

    let global_app_state = web::Data::new(AppState {
        db: db_pool,
        hnsw_map,
    });

    let port: u16 = 31001;
    println!("Starting server on port {}", port);

    HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::default())
            .app_data(global_app_state.clone())
            .service(read_handler)
            .service(write_handler)
            .service(delete_handler)
            .service(query_handler)
    })
    .bind(("127.0.0.1", port))?
    .run()
    .await
}

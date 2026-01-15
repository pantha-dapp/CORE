use hnsw_rs::{dist::DistCosine, hnsw::Hnsw};
use sqlx::SqlitePool;
use std::{collections::HashMap, sync::Mutex};

pub struct AppState {
    pub db: SqlitePool,
    pub hnsw_map: Mutex<HashMap<String, Hnsw<f32, DistCosine>>>,
}

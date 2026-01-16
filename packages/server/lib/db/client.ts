import { Database } from "bun:sqlite";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import * as sqliteVec from "sqlite-vec";
import env from "../../env";
import schema from "./schema";

const db = new Database(env.SQLITE_FILE_PATH);
sqliteVec.load(db);
db.close();

const client = new SQL(env.SQLITE_FILE_PATH);

const dbClient = drizzle(client, {
	schema,
	casing: "snake_case",
});

export default dbClient;

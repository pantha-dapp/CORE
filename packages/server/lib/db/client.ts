import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as sqliteVec from "sqlite-vec";
import env from "../../env";
import schema from "./schema";

const db = new Database(env.SQLITE_FILE_PATH);
sqliteVec.load(db);

const dbClient = drizzle({
	client: db,
	schema,
	casing: "snake_case",
});

export default dbClient;

import { SQL } from "bun"
import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sql";
import * as sqliteVec from "sqlite-vec";
import env from "../../env";
import schema from "./schema";

const client = new SQL(env.SQLITE_FILE_PATH);
const db = new Database(env.SQLITE_FILE_PATH);

const dbClient = drizzle(client, {
    schema,
    casing: "snake_case",
});

export default dbClient;

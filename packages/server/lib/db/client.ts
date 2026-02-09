import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import schema from "./schema";

function createDbClient(filename: string) {
	const db = new Database(filename);

	const dbClient = drizzle({
		client: db,
		schema,
		casing: "snake_case",
	});

	return dbClient;
}

export type DbClient = ReturnType<typeof createDbClient>;

export default createDbClient;

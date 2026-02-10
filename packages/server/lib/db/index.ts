import type { RedisClient } from "bun";
import createDbClient from "./client";
import { dbExtensionHelpers } from "./extensions";
import schema from "./schema";
import type { VectorDbClient } from "./vec/client";

export function createDb(
	filename: string,
	config: { vectorDbClient: VectorDbClient; redisClient: RedisClient },
) {
	const { vectorDbClient, redisClient } = config;
	const dbClient = createDbClient(filename);

	const db = {
		...dbClient,
		select: dbClient.select.bind(dbClient),
		insert: dbClient.insert.bind(dbClient),
		update: dbClient.update.bind(dbClient),
		delete: dbClient.delete.bind(dbClient),
		transaction: dbClient.transaction.bind(dbClient),
		query: dbClient.query,
		...dbExtensionHelpers(dbClient),
		schema,
		vector: vectorDbClient,
		redis: redisClient,
		$db: dbClient, // Expose the raw db client for advanced use cases
	};

	return db;
}

export type Db = ReturnType<typeof createDb>;

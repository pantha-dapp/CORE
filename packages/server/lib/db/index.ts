import createDbClient from "./client";
import { dbExtensionHelpers } from "./extensions";
import schema from "./schema";

export function createDb(filename: string) {
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
	};

	return db;
}

export type Db = ReturnType<typeof createDb>;

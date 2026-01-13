import dbClient from "./client";
import { dbExtensionHelpers } from "./extensions";
import schema from "./schema";

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

export default db;

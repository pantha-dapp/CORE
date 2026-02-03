import * as t from "drizzle-orm/sqlite-core";
import { tUuid } from "../helpers";

export const vectorCache = t.sqliteTable("vector_cache", {
	id: tUuid("id").primaryKey(),
	content: t.text("content").notNull(),
});

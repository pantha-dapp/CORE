import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, timestamps } from "../helpers";

export const users = t.sqliteTable("users", {
	walletAddress: tEvmAddress().primaryKey(),
	username: t.text("username").notNull().unique(),

	lastActiveAt: t.int("last_active_at", { mode: "timestamp" }).notNull(),

	...timestamps,
});

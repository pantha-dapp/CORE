import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, timestamps } from "../helpers.base";

export const followings = t.sqliteTable(
	"followings",
	{
		follower: tEvmAddress().notNull(),
		following: tEvmAddress().notNull(),

		...timestamps,
	},
	(table) => [t.primaryKey({ columns: [table.follower, table.following] })],
);

export const feedpost = t.sqliteTable(
	"feedpost",
	{
		follower: tEvmAddress().notNull(),
		following: tEvmAddress().notNull(),

		...timestamps,
	},
	(table) => [t.primaryKey({ columns: [table.follower, table.following] })],
);

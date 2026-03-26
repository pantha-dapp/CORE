import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, timestamps } from "../helpers.base";
import { tFeedPostPayload } from "../helpers.custom";

export const followings = t.sqliteTable(
	"followings",
	{
		follower: tEvmAddress().notNull(),
		following: tEvmAddress().notNull(),

		...timestamps,
	},
	(table) => [t.primaryKey({ columns: [table.follower, table.following] })],
);

export const feedpost = t.sqliteTable("feedpost", {
	id: t.integer("id").primaryKey({ autoIncrement: true }),
	userWallet: tEvmAddress().notNull(),
	payload: tFeedPostPayload("payload").notNull(),

	...timestamps,
});

import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, timestamps } from "../helpers.base";

export const contractVersions = t.sqliteTable("token_versions", {
	id: t.int().primaryKey({ autoIncrement: true }),
	type: t.text("type", { enum: ["pxp", "shop", "token"] }).notNull(),
	contractAddress: tEvmAddress().notNull(),
	createdAt: timestamps.createdAt,
});

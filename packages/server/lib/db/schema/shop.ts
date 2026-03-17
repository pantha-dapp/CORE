import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, timestamps, tUuid } from "../helpers.base";
import { contractVersions } from "./runtime";
import { users } from "./user";

export const userPurchases = t.sqliteTable("user_purchases", {
	id: tUuid("id").primaryKey(),
	userWallet: tEvmAddress()
		.notNull()
		.references(() => users.walletAddress, {
			onDelete: "cascade",
		}),
	itemId: t.text("item_id").notNull(),
	contractVersion: t
		.int("contract_version")
		.notNull()
		.references(() => contractVersions.id),
	consumed: t.int("consumed").notNull().default(0),
	purchasedAt: timestamps.createdAt,
});

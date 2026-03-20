import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, tHex, timestamps } from "../helpers.base";
import { users } from "./user";

export const personalMessages = t.sqliteTable("personal_messages", {
	id: t.integer().primaryKey({ autoIncrement: true }),
	senderWallet: tEvmAddress()
		.references(() => users.walletAddress)
		.notNull(),
	recipientWallet: tEvmAddress()
		.references(() => users.walletAddress)
		.notNull(),
	ciphertext: tHex().notNull(),
	createdAt: timestamps.createdAt,
});

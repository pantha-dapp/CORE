import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, tHex, timestamps, tUuid } from "../helpers.base";
import { users } from "./user";

export const userDailyActivity = t.sqliteTable(
	"user_daily_activity",
	{
		userWallet: tEvmAddress()
			.notNull()
			.references(() => users.walletAddress, { onDelete: "cascade" }),
		date: t.text("date").notNull(),
		createdAt: timestamps.createdAt,
	},
	(table) => [t.primaryKey({ columns: [table.userWallet, table.date] })],
);

export const userStreaks = t.sqliteTable("user_streaks", {
	userId: tEvmAddress()
		.primaryKey()
		.references(() => users.walletAddress, { onDelete: "cascade" }),
	currentStreak: t.integer("current_streak").notNull().default(0),
	lastActiveDate: t.text("last_active_date"),
	updatedAt: timestamps.updatedAt,
});

export const friendStreaks = t.sqliteTable("friend_streaks", {
	id: t
		.text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userWallet1: tEvmAddress().notNull(), // must always be smaller numerically waller
	userWallet2: tEvmAddress().notNull(),
	currentStreak: t.integer("current_streak").notNull().default(0),
	lastActiveDate: t.text("last_active_date"),
	updatedAt: timestamps.updatedAt,
});

export const userXpLog = t.sqliteTable("user_xp_log", {
	id: tUuid("id").primaryKey(),
	userWallet: tEvmAddress().notNull(),
	xpGained: t.real("xp_gained").notNull(),
	transactionHash: tHex("transaction_hash"),
	success: t.int("success", { mode: "boolean" }).notNull().default(false),
	createdAt: timestamps.createdAt,
});

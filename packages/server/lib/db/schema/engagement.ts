import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, timestamps } from "../helpers.base";
import { users } from "./user";

export const userDailyActivity = t.sqliteTable("user_daily_activity", {
	userWallet: tEvmAddress()
		.primaryKey()
		.references(() => users.walletAddress, { onDelete: "cascade" }),
	date: t.text("date"),
	createdAt: timestamps.createdAt,
});

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

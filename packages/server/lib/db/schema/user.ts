import * as t from "drizzle-orm/sqlite-core";
import { generateRandomUsername } from "../../utils/username";
import {
	tEvmAddress,
	tHex,
	tIanaTimezone,
	timestamps,
	tJsonString,
	tUuid,
} from "../helpers.base";
import { chapterPages } from "./course";

export const users = t.sqliteTable("users", {
	// id: tUuid("id").primaryKey(),
	walletAddress: tEvmAddress().primaryKey(),
	username: t
		.text("username")
		.unique()
		.notNull()
		.$defaultFn(() => generateRandomUsername()),
	lastActiveAt: t.int("last_active_at", { mode: "timestamp" }).notNull(),

	name: t.text("name"),
	timezone: tIanaTimezone("timezone").notNull().default("Europe/London"),
	profileVisibility: t
		.text("profile_visibility", { enum: ["private", "public"] })
		.notNull()
		.default("public"),
	followPolicy: t
		.text("follow_policy", {
			enum: ["anyone", "manual-approve", "noone"],
		})
		.notNull()
		.default("anyone"),

	...timestamps,
});

export const userCourses = t.sqliteTable("user_courses", {
	id: t
		.text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	userWallet: tEvmAddress()
		.notNull()
		.references(() => users.walletAddress, { onDelete: "cascade" }),
	courseId: t.text("course_id").notNull(),
	progress: t.integer("progress").notNull().default(0),

	...timestamps,
});

export const userSessions = t.sqliteTable("user_sessions", {
	id: t
		.text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userWallet: tEvmAddress().notNull(),
});

export const userAnswerLogs = t.sqliteTable("user_answer_logs", {
	id: tUuid("id"),
	pageId: t
		.text("page_id")
		.notNull()
		.references(() => chapterPages.id, { onDelete: "cascade" }),
	correct: t.int("correct", { mode: "boolean" }).notNull(),
});

export const userActions = t.sqliteTable(
	"user_actions",
	{
		hash: tHex("id").primaryKey(),
		prevHash: tHex("previous_id").notNull(),
		userWallet: tEvmAddress().notNull(),
		label: t.text("label").notNull(),
		data: tJsonString("data").notNull(),
		signature: tHex("signature").notNull(),

		...timestamps,
	},
	(table) => [
		t
			.uniqueIndex("user_action_prev_hash_idx")
			.on(table.prevHash, table.userWallet),
		t
			.uniqueIndex("user_action_user_wallet_idx")
			.on(table.userWallet, table.hash),
	],
);

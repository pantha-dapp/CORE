import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, tHex, timestamps } from "../helpers.base";
import { courses } from "./course";
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

export const learningGroupChats = t.sqliteTable("learning_group_chats", {
	id: t.integer().primaryKey({ autoIncrement: true }),
	category: t.text().notNull().unique(),

	createdAt: timestamps.createdAt,
});

export const learningGroupCourses = t.sqliteTable("learning_group_courses", {
	learningGroupChatId: t
		.integer()
		.references(() => learningGroupChats.id, { onDelete: "cascade" })
		.notNull(),
	courseId: t
		.text()
		.references(() => courses.id, { onDelete: "cascade" })
		.notNull(),
});

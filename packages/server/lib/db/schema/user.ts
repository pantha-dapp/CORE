import * as t from "drizzle-orm/sqlite-core";
import { tEvmAddress, timestamps } from "../helpers.base";

export const users = t.sqliteTable("users", {
	// id: tUuid("id").primaryKey(),
	walletAddress: tEvmAddress().primaryKey(),
	username: t.text("username").unique(),
	timezone: t.text("timezone"),
	lastActiveAt: t.int("last_active_at", { mode: "timestamp" }).notNull(),

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
	progress: t.integer("progress").notNull().default(0), // this wil represent number of chappter till which user has reached

	...timestamps,
});

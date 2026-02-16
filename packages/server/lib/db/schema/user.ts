import * as t from "drizzle-orm/sqlite-core";
import { generateRandomUsername } from "../../utils/username";
import { tEvmAddress, tIanaTimezone, timestamps } from "../helpers.base";

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
	progress: t.integer("progress").notNull().default(0), // this wil represent number of chappter till which user has reached

	...timestamps,
});

export const userSessions = t.sqliteTable("user_sessions", {
	id: t
		.text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userWallet: tEvmAddress().notNull(),
});

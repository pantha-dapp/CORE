import * as t from "drizzle-orm/sqlite-core";
import { timestamps, tUuid } from "../helpers";

export const courses = t.sqliteTable("courses", {
	id: tUuid("id").primaryKey(),
	title: t.text("title").notNull(),
	description: t.text("description").notNull(),

	...timestamps,
});

export const courseTopics = t.sqliteTable(
	"course_topics",
	{
		id: tUuid("id").primaryKey(),
		courseId: t
			.text("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		topic: t.text("topic").notNull(),
	},
	(table) => [t.index("idx_course_topics_course_id").on(table.courseId)],
);

export const courseChapters = t.sqliteTable(
	"course_chapters",
	{
		id: tUuid("id").primaryKey(),
		courseId: t
			.text("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		order: t.integer("order").notNull(),
		title: t.text("title").notNull(),
		content: t.text("content").notNull(),
	},
	(table) => [t.index("idx_course_chapters_course_id").on(table.courseId)],
);

export const chapterTopics = t.sqliteTable(
	"chapter_topics",
	{
		id: tUuid("id").primaryKey(),
		chapterId: t
			.text("chapter_id")
			.notNull()
			.references(() => courseChapters.id, { onDelete: "cascade" }),
		topic: t.text("topic").notNull(),
	},
	(table) => [t.index("idx_chapter_topics_chapter_id").on(table.chapterId)],
);

export const chapterPages = t.sqliteTable("chapter_pages", {
	id: tUuid("id").primaryKey(),
	chapterId: t
		.text("chapter_id")
		.notNull()
		.references(() => courseChapters.id, { onDelete: "cascade" }),
	order: t.integer("order").notNull(),
	content: t.text("content").notNull(),
});

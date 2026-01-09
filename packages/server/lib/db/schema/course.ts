import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../helpers";

export const courses = t.pgTable(
	"courses",
	{
		id: t.serial("id").primaryKey(),

		title: t.text("title").notNull(),
		description: t.text("description").notNull(),
		embedding: t.vector("embedding", { dimensions: 768 }).notNull(),

		...timestamps,
	},
	(table) => [
		t
			.index("embeddingIndex")
			.using("hnsw", table.embedding.op("vector_cosine_ops")),
	],
);

export const courseTopics = t.pgTable(
	"course_topics",
	{
		id: t.serial("id").primaryKey(),

		courseId: t
			.integer("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		topic: t.text("topic").notNull(),
	},
	(table) => [t.index("idx_course_topics_course_id").on(table.courseId)],
);

export const courseChapters = t.pgTable(
	"course_chapters",
	{
		id: t.serial("id").primaryKey(),

		courseId: t
			.integer("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		order: t.integer("order").notNull(),
		title: t.text("title").notNull(),
		content: t.text("content").notNull(),
	},
	(table) => [t.index("idx_course_chapters_course_id").on(table.courseId)],
);

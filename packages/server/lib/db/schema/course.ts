import * as t from "drizzle-orm/sqlite-core";
import { timestamps } from "../helpers";

export const courses = t.sqliteTable(
    "courses",
    {
        id: t.text("id").primaryKey().$defaultFn(() => Bun.randomUUIDv7()),

        title: t.text("title").notNull(),
        description: t.text("description").notNull(),

        ...timestamps,
    },
    // (table) => [
    //     t
    //         .index("embeddingIndex")
    //         .using("hnsw", table.embedding.op("vector_cosine_ops")),
    // ],
);

// export const courseTopics = t.sqliteTable(
//     "course_topics",
//     {
//         id: t.serial("id").primaryKey(),

//         courseId: t
//             .integer("course_id")
//             .notNull()
//             .references(() => courses.id, { onDelete: "cascade" }),
//         topic: t.text("topic").notNull(),
//     },
//     (table) => [t.index("idx_course_topics_course_id").on(table.courseId)],
// );

// export const courseChapters = t.sqliteTable(
//     "course_chapters",
//     {
//         id: t.serial("id").primaryKey(),

//         courseId: t
//             .integer("course_id")
//             .notNull()
//             .references(() => courses.id, { onDelete: "cascade" }),
//         order: t.integer("order").notNull(),
//         title: t.text("title").notNull(),
//         content: t.text("content").notNull(),
//     },
//     (table) => [t.index("idx_course_chapters_course_id").on(table.courseId)],
// );

// user -> address, username
// user -> courses, progress

// courses -> topics, chapters (SKELETON)
// chapter -> topics, content
// content -> type, data

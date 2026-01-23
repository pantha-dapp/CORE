import { and, eq, lte } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { generateChapterPages } from "../../../lib/ai/tasks";
import db from "../../../lib/db";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";

export default new Hono()
	.get(
		"/:id",
		authenticated,
		validator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		async (ctx) => {
			const { id } = ctx.req.valid("param");

			const chapter = await db.chapterById({ chapterId: id });

			if (!chapter) {
				return respond.err(ctx, "Chapter not found.", 404);
			}

			return respond.ok(ctx, { chapter }, "Chapter fetched successfully.", 200);
		},
	)

	.get(
		"/:id/pages",
		authenticated,
		validator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		async (ctx) => {
			const { id } = ctx.req.valid("param");

			const chapter = await db.chapterById({ chapterId: id });
			if (!chapter) {
				return respond.err(ctx, "Chapter not found.", 404);
			}

			const chaptersTillNow = await db
				.select()
				.from(db.schema.courseChapters)
				.where(
					and(
						eq(db.schema.courseChapters.courseId, chapter.courseId),
						lte(db.schema.courseChapters.order, chapter.order),
					),
				)
				.orderBy(db.schema.courseChapters.order);

			const chaptersTillNowWithTopics = await Promise.all(
				chaptersTillNow.map(async (ch) => {
					const topics = await db
						.select()
						.from(db.schema.chapterTopics)
						.where(eq(db.schema.chapterTopics.chapterId, ch.id));

					return {
						...ch,
						topics: topics.map((t) => t.topic),
					};
				}),
			);

			const retrievedPages = await db
				.select()
				.from(db.schema.chapterPages)
				.where(eq(db.schema.chapterPages.chapterId, id))
				.orderBy(db.schema.chapterPages.order);

			if (retrievedPages && retrievedPages.length > 0) {
				return respond.ok(
					ctx,
					{ pages: retrievedPages },
					"Chapter pages fetched successfully.",
					200,
				);
			}

			const { pages: generatedPages } = await generateChapterPages({
				chapter: {
					overview: {
						title: chapter.title,
						description: chapter.description,
						intent: chapter.intent,
						topics: chapter.topics,
					},
				},
				courseTillNowOverview: chaptersTillNowWithTopics.map((ch) => ({
					title: ch.title,
					description: ch.description,
					intent: ch.intent,
					topics: ch.topics,
				})),
				minimumPages: 10 + Math.ceil(chaptersTillNow.length / 15),
			});

			const insertedPages = await db.transaction(async (tx) => {
				const inserted = [];
				for (let i = 0; i < generatedPages.length; i++) {
					const page = generatedPages[i];

					if (!page) continue;

					const [insertedPage] = await tx
						.insert(db.schema.chapterPages)
						.values({
							chapterId: id,
							order: i + 1,
							content: page,
						})
						.returning();
					inserted.push(insertedPage);
				}
				return inserted;
			});

			return respond.ok(
				ctx,
				{ pages: insertedPages },
				"Chapter pages generated and fetched successfully.",
				200,
			);
		},
	);

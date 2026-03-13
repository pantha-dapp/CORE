import { tryCatch } from "@pantha/shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { prepareChapter } from "../../../../lib/utils/chapters";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import { createJob } from "../../jobs";
import type { RouterEnv } from "../../types";
import session from "./session";

export default new Hono<RouterEnv>()

	.route("/session", session)

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
			const { db, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { id } = ctx.req.valid("param");

			const chapter = await db.chapterById({ chapterId: id });

			if (!chapter) {
				return respond.err(ctx, "Chapter not found.", 404);
			}

			await policyManager.assertCan(userWallet, "chapter.view", {
				chapterId: id,
			});

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
			const { db, ai, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { id } = ctx.req.valid("param");

			const chapter = await db.chapterById({ chapterId: id });
			if (!chapter) {
				return respond.err(ctx, "Chapter not found.", 404);
			}

			await policyManager.assertCan(userWallet, "chapter.view", {
				chapterId: id,
			});

			const pages = await db.chapterPagesById({ chapterId: id });
			if (!pages || pages.length === 0) {
				const redisKey = `chapter-preparing:${id}`;
				const existingJobId = await db.redis.get(redisKey);
				if (existingJobId) {
					return respond.ok(
						ctx,
						{ jobId: existingJobId },
						"Chapter pages are being prepared.",
						202,
					);
				}

				const { id: jobId, promise } = createJob(db.redis, () =>
					prepareChapter(chapter.id, { db, ai }),
				);
				await db.redis.setex(redisKey, 300, jobId);
				promise.finally(() => db.redis.del(redisKey));

				return respond.ok(
					ctx,
					{ jobId },
					"Chapter pages are being prepared.",
					202,
				);
			}

			const [nextChapter] = await db
				.select()
				.from(db.schema.courseChapters)
				.where(
					and(
						eq(db.schema.courseChapters.courseId, chapter.courseId),
						eq(db.schema.courseChapters.order, chapter.order + 1),
					),
				);
			nextChapter &&
				prepareChapter(nextChapter.id, { db, ai }).catch(console.error);

			for (const p of pages) {
				const { type, content } = p.content;
				switch (type) {
					case "fill_in_the_blanks":
						content.wrongOptions = content.wrongOptions.concat(content.answers);
						content.answers = [];
						break;
					case "identify_object_from_images":
						content.correctImageIndex = -1;
						break;
					case "identify_shown_object_in_image":
						content.correctOptionIndex = -1;
						break;
					case "quiz":
						content.correctOptionIndex = -1;
						break;
					case "true_false":
						content.isTrue = false;
						break;
					default:
						break;
				}
			}

			const images: Record<
				string,
				{ url: string } | { images: { url: string }[] }
			> = {};

			await Promise.race([
				Promise.all(
					pages.map(async (p) => {
						const { type, content } = p.content;
						switch (type) {
							case "example_uses":
							case "fill_in_the_blanks":
							case "identify_shown_object_in_image":
							case "quiz":
							case "teach_and_explain_content":
							case "true_false":
								if (content.image) {
									const { data } = await tryCatch(
										ai.image.generatePageImage({
											prompt: content.image.prompt,
										}),
									);
									if (data) images[p.id] = data;
								}
								break;
							case "identify_object_from_images": {
								const { data } = await tryCatch(
									Promise.all(
										content.images.map((img: { prompt: string }) =>
											ai.image.generatePageImage({
												prompt: img.prompt,
											}),
										),
									),
								);
								if (data) images[p.id] = { images: data };
								break;
							}
							default:
								break;
						}
					}),
				),
				Bun.sleep(5000),
			]);

			return respond.ok(
				ctx,
				{ pages, images },
				"Chapter pages fetched successfully.",
				200,
			);
		},
	);

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { prepareChapter } from "../../../../lib/utils/chapters";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
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
				prepareChapter(chapter.id, { db, ai });
				return respond.err(
					ctx,
					"Chapter pages unavailable at the moment.",
					503,
					{ "Retry-After": "30" },
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
			nextChapter && prepareChapter(nextChapter.id, { db, ai });

			const images: Record<
				string,
				{ url: string } | { images: { url: string }[] }
			> = {};

			//safepages generaton
			pages.forEach(async (p) => {
				const { type, content } = p.content;

				switch (type) {
					case "example_uses":
						if (content.image) {
							const { url } = await ai.image.generatePageImage({
								prompt: content.image.prompt,
							});
							images[p.id] = { url };
						}
						return;
					case "fill_in_the_blanks": {
						content.wrongOptions = content.wrongOptions.concat(content.answers);
						content.answers = [];

						if (content.image) {
							const { url } = await ai.image.generatePageImage({
								prompt: content.image.prompt,
							});
							images[p.id] = { url };
						}

						return;
					}
					case "identify_object_from_images": {
						content.correctImageIndex = -1;

						const imgs: { url: string }[] = [];
						for (const image of content.images) {
							const { url } = await ai.image.generatePageImage({
								prompt: image.prompt,
							});
							imgs.push({ url });
						}
						images[p.id] = { images: imgs };

						return;
					}
					case "identify_shown_object_in_image": {
						content.correctOptionIndex = -1;

						if (content.image) {
							const { url } = await ai.image.generatePageImage({
								prompt: content.image.prompt,
							});
							images[p.id] = { url };
						}

						return;
					}
					case "matching": {
						// sanitization needed but lets do this later
						return;
					}
					case "quiz": {
						content.correctOptionIndex = -1;

						if (content.image) {
							const { url } = await ai.image.generatePageImage({
								prompt: content.image.prompt,
							});
							images[p.id] = { url };
						}

						return;
					}
					case "teach_and_explain_content": {
						if (content.image) {
							const { url } = await ai.image.generatePageImage({
								prompt: content.image.prompt,
							});
							images[p.id] = { url };
						}
						return;
					}
					case "true_false": {
						content.isTrue = false;

						if (content.image) {
							const { url } = await ai.image.generatePageImage({
								prompt: content.image.prompt,
							});
							images[p.id] = { url };
						}
						return;
					}
					default:
						return;
				}
			});

			return respond.ok(
				ctx,
				{ pages, images },
				"Chapter pages fetched successfully.",
				200,
			);
		},
	);

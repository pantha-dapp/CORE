import { Hono } from "hono";
import z from "zod";
import db from "../../../../lib/db";
import { prepareChapter } from "../../../../lib/utils/chapters";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import session from "./session";

export default new Hono()

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

			await prepareChapter(chapter.id);
			const pages = await db.chapterPagesById({ chapterId: id });

			//safepages generaton
			pages.forEach((p) => {
				const { type, content } = p.content;
				switch (type) {
					case "example_uses":
						return;
					case "fill_in_the_blanks": {
						content.wrongOptions = content.wrongOptions.concat(content.answers);
						content.answers = [];
						return;
					}
					case "identify_object_from_images": {
						content.correctImageIndex = -1;
						return;
					}
					case "identify_shown_object_in_image": {
						content.correctOptionIndex = -1;
						return;
					}
					case "matching": {
						// sanitization needed but lets do this later
						return;
					}
					case "quiz": {
						content.correctOptionIndex = -1;
						return;
					}
					case "teach_and_explain_content": {
						return;
					}
					case "true_false": {
						content.isTrue = false;
						return;
					}
					default:
						return;
				}
			});

			return respond.ok(
				ctx,
				{ pages },
				"Chapter pages fetched successfully.",
				200,
			);
		},
	);

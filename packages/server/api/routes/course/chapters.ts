import { Hono } from "hono";
import z from "zod";
import db from "../../../lib/db";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";

export default new Hono().get(
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
);

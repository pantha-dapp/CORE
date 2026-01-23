import { Hono } from "hono";
import z from "zod";
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
	},
);

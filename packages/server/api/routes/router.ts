import { Hono } from "hono";
import { PromptGuardError } from "../../lib/errors";
import { AppError } from "../../lib/errors/app";
import { respond } from "../../lib/utils/respond";
import auth from "./auth";
import courses from "./courses";
import faucet from "./faucet";
import jobs from "./jobs";
import shop from "./shop";
import sse from "./sse";
import type { RouterEnv } from "./types";
import users from "./users";

export const apiRouter = new Hono<RouterEnv>()

	.get("/runtime", (ctx) => {
		const runtime = {
			uptime: process.uptime(),
			chain: 545,
			// serverAddressSynapse: config.serverAddressSynapse,
		};
		return ctx.json(runtime);
	})
	.route("/jobs", jobs)
	.route("/auth", auth)
	.route("/courses", courses)
	.route("/users", users)
	.route("/faucet", faucet)
	.route("/shop", shop)
	.route("/sse", sse)

	.onError((err, ctx) => {
		if (err instanceof PromptGuardError) {
			return respond.ok(
				ctx,
				{ error: err.message, code: err.code },
				"Prompt Guard Error",
				200,
			);
		}

		if (err instanceof AppError) {
			return respond.err(ctx, err.message ?? err.code, err.status);
		}

		console.error(err);

		return respond.err(
			ctx,
			err.message ?? "INTERNAL_SERVER_ERROR: Something went wrong",
			500,
		);
	});

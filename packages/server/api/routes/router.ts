import { Hono } from "hono";
import { AppError } from "../../lib/errors/app";
import { respond } from "../../lib/utils/respond";
import auth from "./auth";
import courses from "./courses";
import jobs from "./jobs";
import type { RouterEnv } from "./types";
import users from "./users";

export const apiRouter = new Hono<RouterEnv>()

	.get("/runtime", (ctx) => {
		const runtime = {
			uptime: process.uptime(),
			// serverAddressSynapse: config.serverAddressSynapse,
			// chain: config.runtimeChain,
		};
		return ctx.json(runtime);
	})
	.route("/jobs", jobs)
	.route("/auth", auth)
	.route("/courses", courses)
	.route("/users", users)

	.onError((err, ctx) => {
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

import { Hono } from "hono";
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
	.route("/users", users);

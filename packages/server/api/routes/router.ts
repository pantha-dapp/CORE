import { Hono } from "hono";
import course from "./course";

export const apiRouter = new Hono()
	.get("/runtime", (ctx) => {
		const runtime = {
			uptime: process.uptime(),
			// serverAddressSynapse: config.serverAddressSynapse,
			// chain: config.runtimeChain,
		};
		return ctx.json(runtime);
	})
	.route("/course", course);

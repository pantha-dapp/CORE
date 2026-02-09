import { Hono } from "hono";
import env from "../../env";
import { attachDb } from "../middleware/attachDb";
import auth from "./auth";
import course from "./course";
import jobs from "./jobs";

export const apiRouter = new Hono()
	.use(attachDb(env.SQLITE_FILE_PATH))
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
	.route("/course", course);

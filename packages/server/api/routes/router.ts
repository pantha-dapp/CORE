import { QdrantClient } from "@qdrant/js-client-rest";
import { Hono } from "hono";
import env from "../../env";
import { aiAdapter } from "../../lib/ai/engine";
import { attachAi } from "../middleware/attachAi";
import { attachDb } from "../middleware/attachDb";
import auth from "./auth";
import course from "./course";
import jobs from "./jobs";

export const apiRouter = new Hono()
	.use(
		attachDb(
			env.SQLITE_FILE_PATH,
			new QdrantClient({
				host: env.QDRANT_HOST,
				port: parseInt(env.QDRANT_PORT, 10),
			}),
		),
	)
	.use(attachAi(aiAdapter))
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

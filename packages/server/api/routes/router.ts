import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { Hono } from "hono";
import env from "../../env";
import { aiAdapter } from "../../lib/ai/engine";
import { InMemoryEventBus } from "../../lib/events/bus";
import { attachAi } from "../middleware/attachAi";
import { attachDb } from "../middleware/attachDb";
import { attachEventBus } from "../middleware/attachEventBus";
import auth from "./auth";
import course from "./course";
import jobs from "./jobs";
import type { RouterEnv } from "./types";
import users from "./users";

export const apiRouter = new Hono<RouterEnv>()

	.use(
		attachDb(
			env.SQLITE_FILE_PATH,
			new QdrantClient({
				host: env.QDRANT_HOST,
				port: parseInt(env.QDRANT_PORT, 10),
			}),
			new RedisClient(),
		),
	)
	.use(attachAi(aiAdapter))
	.use(attachEventBus(new InMemoryEventBus()))

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
	.route("/course", course)
	.route("/users", users);

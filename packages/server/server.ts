import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { attachAi } from "./api/middleware/attachAi";
import { attachEventBus } from "./api/middleware/attachAppState";
import { attachDb } from "./api/middleware/attachDb";
import { apiRouter } from "./api/routes/router";
import env from "./env";
import { aiAdapter } from "./lib/ai/engine";
import { InMemoryEventBus } from "./lib/events/bus";

export const app = new Hono()

	.use(logger())
	.use(
		cors({
			origin: ["*"],
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			credentials: true,
		}),
	)

	.use(
		attachDb(
			env.SQLITE_FILE_PATH,
			new QdrantClient({
				host: env.QDRANT_HOST,
				port: parseInt(env.QDRANT_PORT, 10),
				checkCompatibility: false,
			}),
			new RedisClient(),
		),
	)
	.use(attachAi(aiAdapter))
	.use(attachEventBus(new InMemoryEventBus()))
	.route("/api", apiRouter);

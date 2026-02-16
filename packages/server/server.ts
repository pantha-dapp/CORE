import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { attachAppState } from "./api/middleware/attachAppState";
import { apiRouter } from "./api/routes/router";
import type { AppState } from "./api/routes/types";
import env from "./env";
import { createAi } from "./lib/ai";
import { aiAdapter } from "./lib/ai/engine";
import { createDb } from "./lib/db";
import { InMemoryEventBus } from "./lib/events/bus";
import { DefaultPolicyManager } from "./lib/policies";

const vectorDbClient = new QdrantClient({
	host: env.QDRANT_HOST,
	port: parseInt(env.QDRANT_PORT, 10),
	checkCompatibility: false,
});

const db = createDb(env.SQLITE_FILE_PATH, {
	vectorDbClient,
	redisClient: new RedisClient(),
});

const ai = createAi({ aiClient: aiAdapter, vectorDbClient });

const eventBus = new InMemoryEventBus();

const policyManager = new DefaultPolicyManager({
	db,
});

const appState: AppState = {
	db,
	ai,
	eventBus,
	policyManager,
};

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

	.use(attachAppState(appState))
	.route("/api", apiRouter);

import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { privateKeyToAccount } from "viem/accounts";
import { attachAppState } from "./api/middleware/attachAppState";
import { apiRouter } from "./api/routes/router";
import type { AppState } from "./api/routes/types";
import env from "./env";
import { createAi } from "./lib/ai";
import { aiAdapter } from "./lib/ai/engine";
import { createDb } from "./lib/db";
import { InMemoryEventBus } from "./lib/events/bus";
import { registerEventHandlers } from "./lib/events/handlers";
import { ObjectStorageService } from "./lib/objectStorage/service";
import { DefaultPolicyManager } from "./lib/policies";

const vectorDbClient = new QdrantClient({
	host: env.QDRANT_HOST,
	// port: parseInt(env.QDRANT_PORT, 10),
	// apiKey: env.QDRANT_API_KEY,
	checkCompatibility: false,
});

const db = createDb(env.SQLITE_FILE_PATH, {
	vectorDbClient,
	redisClient: new RedisClient(env.REDIS_CONNECTION_URI),
});

const objectStorage = new ObjectStorageService({
	s3: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		endpoint: env.S3_ENDPOINT,
		bucket: env.S3_BUCKET,
		rootDir: ["pantha-server"],
	},
	synapse: {
		account: privateKeyToAccount(
			(env.EVM_PRIVATE_KEY_SYNAPSE.startsWith("0x")
				? env.EVM_PRIVATE_KEY_SYNAPSE
				: `0x${env.EVM_PRIVATE_KEY_SYNAPSE}`) as `0x${string}`,
		),
		environment: "dev",
		source: "pantha-server",
	},
});

const ai = createAi({ aiClient: aiAdapter, vectorDbClient, objectStorage });

const eventBus = new InMemoryEventBus();

const policyManager = new DefaultPolicyManager({
	db,
});

const appState: AppState = {
	db,
	ai,
	eventBus,
	policyManager,
	objectStorage,
};

// Register event handlers so emitted events are handled (DB updates, prep, etc.)
registerEventHandlers(appState);

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

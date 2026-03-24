import { getContracts } from "@pantha/contracts";
import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { flowTestnet } from "viem/chains";
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
	port: parseInt(env.QDRANT_PORT, 10),
	checkCompatibility: true,
});
const redisClient = new RedisClient(env.REDIS_CONNECTION_URI);
const db = createDb(env.SQLITE_FILE_PATH, { vectorDbClient, redisClient });
const objectStorage = new ObjectStorageService({
	s3: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		endpoint: env.S3_ENDPOINT,
		bucket: env.S3_BUCKET,
		rootDir: ["pantha-dev"],
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
const ai = createAi({ vectorDbClient, aiClient: aiAdapter, objectStorage });
const eventBus = new InMemoryEventBus();
const policyManager = new DefaultPolicyManager({ db });
const contracts = getContracts({
	// @ts-expect-error viem hash collision from transitive dependencies
	chain: flowTestnet,
	// @ts-expect-error viem hash collision from transitive dependencies
	client: createWalletClient({
		account: privateKeyToAccount(
			(env.EVM_PRIVATE_KEY.startsWith("0x")
				? env.EVM_PRIVATE_KEY
				: `0x${env.EVM_PRIVATE_KEY}`) as `0x${string}`,
		),
		transport: http(flowTestnet.rpcUrls.default.http[0]),
		chain: flowTestnet,
	}),
});

const appState: AppState = {
	ai,
	db,
	eventBus,
	policyManager,
	objectStorage,
	contracts,
};
// Register event handlers so emitted events are handled (DB updates, prep, etc.)
registerEventHandlers(appState);

export const app = new Hono()

	.use(logger())
	.use(
		cors({
			origin: ["*"],
			allowHeaders: ["Content-Type", "Authorization", "X-Signature"],
			allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			credentials: true,
		}),
	)
	.use("*", async (c, next) => {
		const id = crypto.randomUUID();
		const start = Date.now();

		console.log(`[${id}] -> ${c.req.method} ${c.req.path}`);

		try {
			await next();
		} finally {
			const duration = Date.now() - start;
			console.log(`[${id}] <- ${c.req.method} ${c.req.path} ${duration}ms`);
		}
	})
	.use("*", async (c, next) => {
		const start = Date.now();

		try {
			await next();
		} finally {
			const duration = Date.now() - start;

			if (duration > 10000) {
				console.error(
					`[TIMEOUT?] ${c.req.method} ${c.req.path} took ${duration}ms`,
				);
			}
		}
	})
	.use(attachAppState(appState))
	.route("/api", apiRouter);

import "dotenv/config";
import { websocket } from "hono/bun";
import env, { ensureEnv } from "./env";

ensureEnv();

import { getContracts } from "@pantha/contracts";
import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { flowTestnet } from "viem/chains";
import { attachAppState } from "./api/middleware/attachAppState";
import type { AppState } from "./api/routes/types";
import { createAi } from "./lib/ai";
import { aiAdapter } from "./lib/ai/engine";
import { createDb } from "./lib/db";
import { InMemoryEventBus } from "./lib/events/bus";
import { ObjectStorageService } from "./lib/objectStorage/service";
import { DefaultPolicyManager } from "./lib/policies";
import { app } from "./server";

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
	chainId: 545,
	// @ts-expect-error -- bun installs two viem@2.44.4 cache entries (workspace vs root); structurally identical at runtime
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

app.use(attachAppState(appState));

//@ts-expect-error
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export default {
	port: env.PORT ? parseInt(env.PORT, 10) : 31001,
	fetch: app.fetch,
	websocket: websocket,
};

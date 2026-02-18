import "dotenv/config";
import { websocket } from "hono/bun";
import env, { ensureEnv } from "./env";

ensureEnv();

import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { attachAppState } from "./api/middleware/attachAppState";
import { createAi } from "./lib/ai";
import { aiAdapter } from "./lib/ai/engine";
import { createDb } from "./lib/db";
import { InMemoryEventBus } from "./lib/events/bus";
import { DefaultPolicyManager } from "./lib/policies";
import { app } from "./server";

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

const policyManager = new DefaultPolicyManager({ db });

app.use(
	attachAppState({
		db,
		ai,
		eventBus,
		policyManager,
	}),
);

//@ts-expect-error
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export default {
	port: env.PORT ? parseInt(env.PORT, 10) : 31001,
	fetch: app.fetch,
	websocket: websocket,
};

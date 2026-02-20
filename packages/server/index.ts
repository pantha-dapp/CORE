import "dotenv/config";
import { websocket } from "hono/bun";
import env, { ensureEnv } from "./env";

ensureEnv();

import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { attachAppState } from "./api/middleware/attachAppState";
import type { AppState } from "./api/routes/types";
import { createAi } from "./lib/ai";
import { aiAdapter } from "./lib/ai/engine";
import { createDb } from "./lib/db";
import { InMemoryEventBus } from "./lib/events/bus";
import { DefaultPolicyManager } from "./lib/policies";
import { app } from "./server";

const vectorDbClient = new QdrantClient({
	host: env.QDRANT_HOST,
	port: parseInt(env.QDRANT_PORT, 10),
	checkCompatibility: true,
});
const redisClient = new RedisClient();
const db = createDb(env.SQLITE_FILE_PATH, { vectorDbClient, redisClient });
const ai = createAi({ vectorDbClient, aiClient: aiAdapter });
const eventBus = new InMemoryEventBus();
const policyManager = new DefaultPolicyManager({ db });

const appState: AppState = {
	ai,
	db,
	eventBus,
	policyManager,
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

import "dotenv/config";
import { websocket } from "hono/bun";
import env, { ensureEnv } from "./env";

ensureEnv();

import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { attachAi } from "./api/middleware/attachAi";
import { attachDb } from "./api/middleware/attachDb";
import { attachEventBus } from "./api/middleware/attachEventBus";
import { aiAdapter } from "./lib/ai/engine";
import { InMemoryEventBus } from "./lib/events/bus";
import { app } from "./server";

app
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
	.use(attachEventBus(new InMemoryEventBus()));

//@ts-expect-error
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export default {
	port: env.PORT ? parseInt(env.PORT, 10) : 31001,
	fetch: app.fetch,
	websocket: websocket,
};

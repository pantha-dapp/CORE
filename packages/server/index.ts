import "dotenv/config";
import { websocket } from "hono/bun";
import env, { ensureEnv } from "./env";

ensureEnv();

import { app } from "./server";

//@ts-expect-error
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export default {
	port: env.PORT ? parseInt(env.PORT, 10) : 31001,
	fetch: app.fetch,
	websocket: websocket,
};

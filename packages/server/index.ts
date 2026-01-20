import "dotenv/config";
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
};

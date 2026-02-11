import type { hc } from "hono/client";
import type { apiRouter } from "../../routes/router";

//@ts-expect-error <- stupid but neded
export const testGlobals: {
	api0: ReturnType<typeof hc<typeof apiRouter>>;
	api1: ReturnType<typeof hc<typeof apiRouter>>;
	api2: ReturnType<typeof hc<typeof apiRouter>>;
} = {};

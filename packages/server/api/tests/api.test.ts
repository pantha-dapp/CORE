import { describe, expect, it } from "bun:test";
import { hc } from "hono/client";
import { apiRouter } from "../routes/router";

const api = hc<typeof apiRouter>("", {
	fetch: (req: unknown) => apiRouter.request(req),
});

describe("API", () => {
	it("/runtime returns uptime", async () => {
		const res = await api.runtime.$get();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.uptime).toBeNumber();
	});
});

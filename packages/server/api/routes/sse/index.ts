import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { sse } from "../../../lib/utils/sse";
import { authenticated } from "../../middleware/auth";
import type { RouterEnv } from "../types";

const app = new Hono<RouterEnv>().get("/events", authenticated, async (ctx) => {
	const { appState, userWallet } = ctx.var;
	const { redis } = appState.db;
	const lastEventId = ctx.req.header("Last-Event-ID") ?? "$";

	return streamSSE(ctx, async (stream) => {
		let lastId = lastEventId;
		let aborted = false;

		stream.onAbort(() => {
			aborted = true;
			clearInterval(heartbeat);
		});

		const heartbeat = setInterval(() => {
			stream.writeSSE({ event: "ping", data: "1" });
		}, 15000);

		try {
			while (!aborted) {
				const messages = await sse.readUserEvents(redis, {
					userWallet,
					lastId,
					blockMs: 5000,
					count: 50,
				});

				for (const msg of messages) {
					await stream.writeSSE({
						event: msg.type,
						data: JSON.stringify(msg.payload),
						id: msg.id,
					});
					lastId = msg.id;
				}
			}
		} catch (err) {
			if (!aborted) console.error("SSE stream error:", err);
		} finally {
			clearInterval(heartbeat);
		}
	});
});

export default app;

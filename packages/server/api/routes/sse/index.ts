import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { sse } from "../../../lib/utils/sse";
import { authenticated } from "../../middleware/auth";
import type { RouterEnv } from "../types";

const app = new Hono<RouterEnv>().get("/events", authenticated, async (ctx) => {
	const { appState, userWallet } = ctx.var;
	const { redis } = appState.db;
	// Use client's last-seen ID for resumption, or a fixed timestamp anchor for new connections.
	// Never use "$" — it re-evaluates to the stream's current tail on every XREAD call,
	// causing a race where events written between two XREAD cycles are permanently missed.
	const clientLastId = ctx.req.header("Last-Event-ID");
	const lastEventId = clientLastId ?? `${Date.now()}-0`;

	return streamSSE(ctx, async (stream) => {
		let lastId = lastEventId;
		let aborted = false;
		console.log(
			`[SSE] client connected wallet=${userWallet} lastEventId=${lastEventId}`,
		);

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
				if (messages.length > 0) {
					console.log(
						`[SSE] sending ${messages.length} message(s) to wallet=${userWallet}`,
						messages,
					);
				}

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

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { sse } from "../../../lib/utils/sse";
import { authenticated } from "../../middleware/auth";
import type { RouterEnv } from "../types";

const app = new Hono<RouterEnv>().get("/events", authenticated, async (ctx) => {
	const { userWallet } = ctx.var;

	return streamSSE(ctx, async (stream) => {
		let aborted = false;
		let pendingResolve: (() => void) | null = null;

		stream.onAbort(() => {
			aborted = true;
			pendingResolve?.();
			pendingResolve = null;
		});

		const queue: Array<{ type: string; payload: unknown }> = [];

		const unsubscribe = sse.subscribe(userWallet, (event) => {
			queue.push(event);
			pendingResolve?.();
			pendingResolve = null;
		});

		const heartbeat = setInterval(() => {
			if (!aborted) stream.writeSSE({ event: "ping", data: "1" });
		}, 15000);

		console.log(`[SSE] client connected wallet=${userWallet}`);

		try {
			while (!aborted) {
				if (queue.length === 0) {
					await new Promise<void>((r) => {
						pendingResolve = r;
					});
				}

				if (aborted) break;

				const batch = queue.splice(0);
				for (const msg of batch) {
					if (aborted) break;
					await stream.writeSSE({
						event: msg.type,
						data: JSON.stringify(msg.payload),
					});
				}
			}
		} catch (err) {
			if (!aborted) console.error("[SSE] stream error:", err);
		} finally {
			clearInterval(heartbeat);
			unsubscribe();
			console.log(`[SSE] client disconnected wallet=${userWallet}`);
		}
	});
});

export default app;

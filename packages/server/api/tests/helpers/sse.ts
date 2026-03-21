import type { RedisClient } from "bun";
import { sse } from "../../../lib/utils/sse";

type SseEvent = { id: string; type: string; payload: unknown };

export async function expectSseEvent(
	redis: RedisClient,
	opts: {
		userWallet: string;
		type: string;
		lastId?: string;
		timeoutMs?: number;
	},
): Promise<SseEvent> {
	const deadline = Date.now() + (opts.timeoutMs ?? 5000);

	let lastId = opts.lastId ?? "0";

	while (Date.now() < deadline) {
		// Non-blocking reads to avoid holding the shared RedisClient connection
		const events: SseEvent[] = await sse.readUserEvents(redis, {
			userWallet: opts.userWallet,
			lastId,
			blockMs: 0,
			count: 50,
		});

		for (const evt of events) {
			lastId = evt.id;
			if (evt.type === opts.type) return evt;
		}

		await new Promise((r) => setTimeout(r, 50));
	}

	throw new Error(
		`Timed out waiting for SSE event "${opts.type}" for ${opts.userWallet}`,
	);
}

export async function collectSseEvents(
	redis: RedisClient,
	opts: {
		userWallet: string;
		type?: string;
		lastId?: string;
	},
): Promise<SseEvent[]> {
	const events: SseEvent[] = await sse.readUserEvents(redis, {
		userWallet: opts.userWallet,
		lastId: opts.lastId ?? "0",
		blockMs: 0,
		count: 100,
	});

	if (opts.type) return events.filter((e) => e.type === opts.type);
	return events;
}

export async function drainSseStream(
	redis: RedisClient,
	userWallet: string,
): Promise<string> {
	const events: SseEvent[] = await sse.readUserEvents(redis, {
		userWallet,
		lastId: "0",
		blockMs: 0,
		count: 1000,
	});

	if (events.length === 0) return "0";
	const last = events[events.length - 1];
	return last?.id ?? "0";
}

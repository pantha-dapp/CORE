import type { zSseEvent } from "@pantha/shared/zod";
import type { RedisClient } from "bun";
import type z from "zod";

type EmitEvent = z.infer<ReturnType<typeof zSseEvent>>;
type EventType = EmitEvent["type"];
type EmitEventByType<T extends EventType> = Extract<EmitEvent, { type: T }>;

async function emitToUser(redis: RedisClient, evt: EmitEvent) {
	const key = `sse:${evt.userWallet}`;

	await redis.send("XADD", [
		key,
		"*",
		"type",
		evt.type,
		"payload",
		JSON.stringify(evt.payload),
	]);
	await trimUserStream(redis, evt.userWallet);
}

async function emitToUsers<T extends EventType>(
	redis: RedisClient,
	userWallets: string[],
	type: T,
	payload: EmitEventByType<T>["payload"],
) {
	const serialized = JSON.stringify(payload);

	await Promise.all(
		userWallets.map(async (userWallet) => {
			await redis.send("XADD", [
				`sse:${userWallet}`,
				"*",
				"type",
				type,
				"payload",
				serialized,
			]);
			await trimUserStream(redis, userWallet);
		}),
	);
}

type ReadOptions = {
	userWallet: string;
	lastId?: string;
	blockMs?: number;
	count?: number;
};

async function readUserEvents(redis: RedisClient, opts: ReadOptions) {
	const key = `sse:${opts.userWallet}`;
	const count = String(opts.count ?? 50);
	const blockMs = opts.blockMs ?? 5000;

	const args =
		blockMs > 0
			? [
					"COUNT",
					count,
					"BLOCK",
					String(blockMs),
					"STREAMS",
					key,
					opts.lastId ?? "$",
				]
			: ["COUNT", count, "STREAMS", key, opts.lastId ?? "0"];

	const res = await redis.send("XREAD", args);
	console.log(
		`[SSE] XREAD key=${key} lastId=${opts.lastId ?? "$"} raw=`,
		JSON.stringify(res),
	);

	if (!res) return [];

	// Bun's RedisClient returns XREAD as a RESP3 map object:
	// { [streamKey]: [[id, [field, value, ...]], ...] }
	const messages = Object.values(
		res as Record<string, [string, string[]][]>,
	)[0];
	if (!messages) return [];

	return messages.map(([id, fields]: [string, string[]]) => {
		const obj: Record<string, string> = {};
		for (let i = 0; i < fields.length; i += 2) {
			const key = fields[i];
			const val = fields[i + 1];
			if (key !== undefined && val !== undefined) obj[key] = val;
		}
		return {
			id,
			type: obj.type ?? "",
			payload: JSON.parse(obj.payload ?? "null"),
		};
	});
}

async function trimUserStream(redis: RedisClient, userWallet: string) {
	await redis.send("XTRIM", [`sse:${userWallet}`, "MAXLEN", "~", "1000"]);
}

export const sse = {
	emitToUser,
	emitToUsers,
	readUserEvents,
};

import type { RedisClient } from "bun";

type EventDefs = {
	"dm:new": {
		from: string;
	};
	"streak:extended": {
		currentStreak: number;
	};
	"friend-streak:extended": {
		friendWallet: string;
		currentStreak: number;
	};
};

type EventType = keyof EventDefs;

type EmitEvent<T extends EventType = EventType> = {
	userWallet: string;
	type: T;
	payload: EventDefs[T];
};

async function emitToUser<T extends EventType>(
	redis: RedisClient,
	evt: EmitEvent<T>,
) {
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

async function emitToUsers(
	redis: RedisClient,
	userWallets: string[],
	type: string,
	payload: unknown,
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
	const blockMs = String(opts.blockMs ?? 5000);
	const count = String(opts.count ?? 50);

	const res = await redis.send("XREAD", [
		"COUNT",
		count,
		"BLOCK",
		blockMs,
		"STREAMS",
		key,
		opts.lastId ?? "$",
	]);

	if (!res) return [];

	// XREAD returns [[streamKey, [[id, [field, value, ...]], ...]]]
	const result = res;
	const stream = result[0];
	if (!stream) return [];

	const [, messages] = stream;

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

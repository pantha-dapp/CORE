import type { zSseEvent } from "@pantha/shared/zod";
import type z from "zod";

type EmitEvent = z.infer<ReturnType<typeof zSseEvent>>;
type EventType = EmitEvent["type"];
type EmitEventByType<T extends EventType> = Extract<EmitEvent, { type: T }>;

export type SseQueueEntry = { type: string; payload: unknown };
type Subscriber = (event: SseQueueEntry) => void;

// Module-level in-memory subscriber registry: normalized wallet → active subscribers
const subscribers = new Map<string, Set<Subscriber>>();

function normalizeWallet(w: string) {
	return w.toLowerCase();
}

function emitToUser(evt: EmitEvent) {
	const key = normalizeWallet(evt.userWallet);
	const subs = subscribers.get(key);
	if (!subs || subs.size === 0) return;
	const entry: SseQueueEntry = { type: evt.type, payload: evt.payload };
	for (const sub of subs) sub(entry);
}

function emitToUsers<T extends EventType>(
	userWallets: string[],
	type: T,
	payload: EmitEventByType<T>["payload"],
) {
	for (const userWallet of userWallets) {
		emitToUser({ userWallet, type, payload } as EmitEvent);
	}
}

function subscribe(userWallet: string, callback: Subscriber): () => void {
	const key = normalizeWallet(userWallet);
	let set = subscribers.get(key);
	if (!set) {
		set = new Set();
		subscribers.set(key, set);
	}
	set.add(callback);
	return () => {
		const s = subscribers.get(key);
		if (s) {
			s.delete(callback);
			if (s.size === 0) subscribers.delete(key);
		}
	};
}

export const sse = {
	emitToUser,
	emitToUsers,
	subscribe,
};

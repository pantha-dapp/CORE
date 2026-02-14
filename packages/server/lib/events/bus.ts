import { zEvmAddress } from "@pantha/shared/zod";
import z from "zod";
import type { AppState } from "../../api/routes/types";

const eventPayloads = {
	"user.register": z.object({
		walletAddress: zEvmAddress(),
	}),
	"user.login": z.object({
		walletAddress: zEvmAddress(),
	}),
};
type EventType = keyof typeof eventPayloads;
type EventPayload<T extends EventType> = z.infer<(typeof eventPayloads)[T]>;
type DomainEvent<T extends EventType> = {
	type: T;
	payload: EventPayload<T>;
	timestamp: number;
	version: number;
};

type AppStateReduced = Omit<AppState, "eventBus">;

export interface EventBus {
	emit<T extends EventType>(
		type: T,
		payload: EventPayload<T>,
		version?: number,
	): void;

	on<T extends EventType>(
		eventType: T,
		handler: (payload: EventPayload<T>) => void,
	): void;
}

export class InMemoryEventBus implements EventBus {
	private handlers: {
		[K in EventType]?: Array<
			(payload: EventPayload<K>, app: AppStateReduced) => void
		>;
	} = {};
	private app: AppStateReduced;

	constructor(appState: AppStateReduced) {
		this.app = { ...appState };
	}

	emit<T extends EventType>(
		type: T,
		payload: EventPayload<T>,
		version?: number,
	): void {
		const domainEvent: DomainEvent<T> = {
			type,
			payload,
			timestamp: Date.now(),
			version: version ?? 1,
		};
		const eventHandlers = this.handlers[type] ?? [];
		Promise.allSettled(
			eventHandlers.map((handler) => handler(domainEvent.payload, this.app)),
		);
	}

	on<T extends EventType>(
		eventType: T,
		handler: (payload: EventPayload<T>, app: AppStateReduced) => void,
	): void {
		if (!this.handlers[eventType]) {
			this.handlers[eventType] = [];
		}
		this.handlers[eventType].push(handler);
	}
}

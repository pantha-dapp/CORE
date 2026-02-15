import type z from "zod";
import type { eventPayloadDefs as eventPayloads } from "./defs";

type EventType = keyof typeof eventPayloads;
type EventPayload<T extends EventType> = z.infer<(typeof eventPayloads)[T]>;
type DomainEvent<T extends EventType> = {
	type: T;
	payload: EventPayload<T>;
	timestamp: number;
	version: number;
};

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
		[K in EventType]?: Array<(payload: EventPayload<K>) => void>;
	} = {};

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
			eventHandlers.map((handler) => handler(domainEvent.payload)),
		);
	}

	on<T extends EventType>(
		eventType: T,
		handler: (payload: EventPayload<T>) => void,
	): void {
		if (!this.handlers[eventType]) {
			this.handlers[eventType] = [];
		}
		this.handlers[eventType].push(handler);
	}
}

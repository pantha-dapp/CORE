import z from "zod";

const eventPayloads = {
	"user.register": z.object({
		walletAddress: z.string(),
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

export interface EventBus {
	emit<T extends EventType>(
		event: Omit<DomainEvent<T>, "timestamp"> & { version?: number },
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
		event: Omit<DomainEvent<T>, "timestamp"> & { version?: number },
	): void {
		const domainEvent: DomainEvent<T> = {
			...event,
			timestamp: Date.now(),
			version: event.version ?? 1,
		};
		const eventHandlers = this.handlers[event.type] ?? [];
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

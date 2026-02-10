import type { MiddlewareHandler } from "hono";
import type { EventBus } from "../../lib/events/bus";

export function attachEventBus(eventBus: EventBus): MiddlewareHandler {
	return async function attachEventBus(ctx, next) {
		ctx.set("eventBus", eventBus);
		await next();
	};
}

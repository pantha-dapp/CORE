import type { MiddlewareHandler } from "hono";
import type { AppState, RouterEnv } from "../routes/types";

export function attachAppState(
	appState: AppState,
): MiddlewareHandler<RouterEnv> {
	return async function attachAppState(ctx, next) {
		ctx.set("appState", appState);
		await next();
	};
}

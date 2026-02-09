import type { MiddlewareHandler } from "hono";
import { createDb } from "../../lib/db";

export function attachDb(filename: string): MiddlewareHandler {
	const db = createDb(filename);

	return async function attachDb(ctx, next) {
		ctx.set("db", db);
		await next();
	};
}

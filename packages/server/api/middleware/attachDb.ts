import type { MiddlewareHandler } from "hono";
import { createDb } from "../../lib/db";
import type { VectorDbClient } from "../../lib/db/vec/client";

export function attachDb(
	filename: string,
	vectorDbClient: VectorDbClient,
): MiddlewareHandler {
	const db = createDb(filename, vectorDbClient);

	return async function attachDb(ctx, next) {
		ctx.set("db", db);
		await next();
	};
}

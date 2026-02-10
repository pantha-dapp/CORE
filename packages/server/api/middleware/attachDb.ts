import type { RedisClient } from "bun";
import type { MiddlewareHandler } from "hono";
import { createDb } from "../../lib/db";
import type { VectorDbClient } from "../../lib/db/vec/client";

export function attachDb(
	filename: string,
	vectorDbClient: VectorDbClient,
	redisClient: RedisClient,
): MiddlewareHandler {
	const db = createDb(filename, { vectorDbClient, redisClient });

	return async function attachDb(ctx, next) {
		ctx.set("db", db);
		await next();
	};
}

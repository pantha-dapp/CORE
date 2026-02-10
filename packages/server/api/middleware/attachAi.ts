import type { MiddlewareHandler } from "hono";
import { createAi } from "../../lib/ai";
import type { AiClient } from "../../lib/ai/client";

export function attachAi(aiClient: AiClient): MiddlewareHandler {
	return async function attachAi(ctx, next) {
		const { vector: vectorDbClient } = ctx.var.db;
		if (!vectorDbClient) {
			throw new Error(
				"VectorDbClient not found in context. Make sure attachVecDb middleware is used before attachAi.",
			);
		}

		const ai = createAi({
			aiClient,
			vectorDbClient,
		});
		ctx.set("ai", ai);
		await next();
	};
}

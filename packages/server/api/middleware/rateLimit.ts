import { createMiddleware } from "hono/factory";
import type { Address } from "viem";
import { respond } from "../../lib/utils/respond";
import type { RouterEnv } from "../routes/types";

export const rateLimit = (options: {
	windowMs: number;
	maxRequests?: number;
}) =>
	createMiddleware<{
		Variables: {
			userWallet: Address;
		} & RouterEnv["Variables"];
	}>(async (ctx, next) => {
		const { db } = ctx.var.appState;
		const { userWallet } = ctx.var;
		const cache = db.redis;

		const key = `ratelimit:${userWallet}:${ctx.req.path}`;
		const current = await cache.incr(key);

		if (current === 1) {
			await cache.expire(key, Math.ceil(options.windowMs / 1000));
		}

		ctx.header("Retry-After", String(Math.ceil(options.windowMs / 1000)));

		if (current > (options.maxRequests ?? 1)) {
			const ttl = await cache.ttl(key);
			return respond.err(
				ctx,
				`Rate limit exceeded. Try again in ${ttl} second${ttl === 1 ? "" : "s"}`,
				429,
			);
		}

		return next();
	});

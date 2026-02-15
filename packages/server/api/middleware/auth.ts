import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { type Address, isAddress } from "viem";
import { verifyJwt } from "../../lib/utils/jwt";
import { respond } from "../../lib/utils/respond";
import type { RouterEnv } from "../routes/types";

export const authenticated = createMiddleware<{
	Variables: {
		userWallet: Address;
	} & RouterEnv["Variables"];
}>(async (ctx, next) => {
	const { db } = ctx.var.appState;
	const cache = db.redis;

	if (!db) {
		throw new Error(
			"Database instance not found in context, instantiate attachDb middleware before authenticated middleware",
		);
	}
	const authHeader = ctx.req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return respond.err(ctx, "Missing or invalid authorization header", 401);
	}

	const token = authHeader.substring(7); // Remove "Bearer " prefix

	let payload: ReturnType<typeof verifyJwt>;
	try {
		payload = verifyJwt(token);
	} catch (_) {
		return respond.err(ctx, "Invalid or expired token", 401);
	}
	if (!payload || !payload.sub) {
		return respond.err(ctx, "Invalid or expired token", 401);
	}

	const cachedSessionWallet = await cache.get(
		`user_session:wallet:${payload.sub}`,
	);
	if (cachedSessionWallet) {
		if (isAddress(cachedSessionWallet)) {
			ctx.set("userWallet", cachedSessionWallet);
		} else {
			await cache.del(`user_session:wallet:${payload.sub}`);
			return respond.err(ctx, "Invalid or expired session", 401);
		}
	} else {
		const [session] = await db
			.select()
			.from(db.schema.userSessions)
			.where(eq(db.schema.userSessions.id, payload.sub))
			.limit(1);

		if (!session) {
			return respond.err(ctx, "Session not found", 401);
		}

		ctx.set("userWallet", session.userWallet);

		const ttl = payload.exp - Math.floor(Date.now() / 1000);

		if (ttl <= 0) {
			return respond.err(ctx, "Token expired", 401);
		}

		await cache.setex(
			`user_session:wallet:${payload.sub}`,
			ttl,
			session.userWallet,
		);
	}

	if (!isAddress(ctx.var.userWallet)) {
		return respond.err(ctx, "Invalid wallet address in token", 401);
	}

	await next();
});

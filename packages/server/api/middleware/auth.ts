import { eq } from "drizzle-orm/sql/expressions/conditions";
import { createMiddleware } from "hono/factory";
import type { Address } from "viem";
import { verifyJwt } from "../../lib/utils/jwt";
import { respond } from "../../lib/utils/respond";
import type { RouterEnv } from "../routes/types";

export const authenticated = createMiddleware<{
	Variables: {
		userWallet: Address;
	} & RouterEnv["Variables"];
}>(async (ctx, next) => {
	const { db } = ctx.var;
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

	ctx.set("userWallet", payload.sub);
	await next();

	db.update(db.schema.users)
		.set({ lastActiveAt: new Date() })
		.where(eq(db.schema.users.walletAddress, payload.sub));
});

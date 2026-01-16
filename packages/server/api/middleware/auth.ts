import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import type { Address } from "viem";
import db from "../../lib/db";
import { verifyJwt } from "../../lib/utils/jwt";
import { respond } from "../../lib/utils/respond";

export const authenticated = createMiddleware<{
	Variables: {
		userWallet: Address;
	};
}>(async (ctx, next) => {
	const authHeader = ctx.req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return respond.err(ctx, "Missing or invalid authorization header", 401);
	}

	const token = authHeader.substring(7); // Remove "Bearer " prefix

	const payload = verifyJwt(token);

	if (!payload || !payload.sub) {
		return respond.err(ctx, "Invalid or expired token", 401);
	}

	ctx.set("userWallet", payload.sub);
	await next();
	// Updated last active time without awaiting, as it's not critical for the response
	db.update(db.schema.users)
		.set({ lastActiveAt: new Date() })
		.where(eq(db.schema.users.walletAddress, payload.sub))
		.execute();
});

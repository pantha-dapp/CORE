import { zEvmAddress } from "@pantha/shared/zod";
import type { RedisClient } from "bun";
import { Hono } from "hono";
import { type Address, createPublicClient, http, isAddress, isHex } from "viem";
import { mainnet } from "viem/chains";
import { parseSiweMessage, verifySiweMessage } from "viem/siwe";
import z from "zod";
import { issueJwtToken } from "../../../lib/utils/jwt";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";
import type { RouterEnv } from "../types";

const publicClient = createPublicClient({
	chain: mainnet,
	transport: http(),
});

function generateNonce(): string {
	return Bun.randomUUIDv7();
}

export default new Hono<RouterEnv>()

	.get(
		"/nonce",
		validator("query", z.object({ address: zEvmAddress() })),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const nonceStore = getNonceStore(db.redis);
			const { address: wallet } = ctx.req.valid("query");

			const nonce = generateNonce();
			nonceStore.set(wallet, nonce);

			return respond.ok(ctx, { nonce }, "nonce generated", 200);
		},
	)

	.post(
		"/verify",
		validator(
			"json",
			z.object({
				message: z.string(),
				signature: z.string(),
			}),
		),
		async (ctx) => {
			const { db, eventBus } = ctx.var.appState;
			const nonceStore = getNonceStore(db.redis);

			const { message, signature } = ctx.req.valid("json");

			if (!message || typeof message !== "string") {
				return respond.err(ctx, "Missing SIWE message", 400);
			}
			if (!signature || typeof signature !== "string" || !isHex(signature)) {
				return respond.err(ctx, "Missing or invalid signature", 400);
			}

			const siweMessage = parseSiweMessage(message);
			const address = siweMessage.address;

			if (!address || !isAddress(address)) {
				return respond.err(ctx, "Invalid address in SIWE message", 400);
			}

			const msgData = await nonceStore.get(address);
			nonceStore.del(address);

			if (!msgData) {
				return respond.err(ctx, "Nonce expired or not found", 400);
			}

			if (siweMessage.nonce !== msgData) {
				return respond.err(ctx, "Nonce mismatch", 400);
			}

			const valid = await verifySiweMessage(publicClient, {
				message,
				signature,
			});

			if (!valid) {
				return respond.err(ctx, "Invalid signature", 400);
			}

			const [session] = await db
				.insert(db.schema.userSessions)
				.values({
					userWallet: address,
				})
				.returning();
			if (!session) {
				return respond.err(ctx, "Failed to start new jser session", 500);
			}

			const token = issueJwtToken(session.id);

			eventBus.emit("user.logged_in", {
				walletAddress: address,
			});

			return respond.ok(ctx, { valid, token }, "Signature verified", 200);
		},
	)

	.get("/validate", authenticated, async (ctx) => {
		return respond.ok(
			ctx,
			{ userWallet: ctx.var.userWallet, valid: true },
			"Token is valid",
			200,
		);
	});

function getNonceStore(redis: RedisClient) {
	const identifier = (address: Address) => `siwe-nonce:${address}`;

	async function set(address: Address, nonce: string) {
		await redis.setex(identifier(address), 120, nonce);
	}

	async function get(address: Address): Promise<string | null> {
		return await redis.get(identifier(address));
	}

	async function del(address: Address) {
		await redis.del(identifier(address));
	}

	return { set, get, del };
}

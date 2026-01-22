import { MINUTE } from "@pantha/shared/constants";
import { Hono } from "hono";
import {
	type Address,
	createPublicClient,
	type Hex,
	http,
	isAddress,
	isHex,
} from "viem";
import { mainnet } from "viem/chains";
import { parseSiweMessage, verifySiweMessage } from "viem/siwe";
import db from "../../../lib/db";
import { issueJwtToken } from "../../../lib/utils/jwt";
import { respond } from "../../../lib/utils/respond";

const nonces: Record<Address, { nonce: string; validTill: number }> = {};
const { users } = db.schema;

const publicClient = createPublicClient({
	chain: mainnet,
	transport: http(),
});

function generateNonce(): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let nonce = "";
	for (let i = 0; i < 16; i++) {
		nonce += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return nonce;
}

export default new Hono()

	.get("/nonce", async (ctx) => {
		const wallet = ctx.req.query("address");
		if (!wallet || !isAddress(wallet)) {
			return respond.err(ctx, "Missing wallet address", 400);
		}

		const nonce = generateNonce();
		nonces[wallet] = { nonce, validTill: Date.now() + 5 * MINUTE };

		return respond.ok(ctx, { nonce }, "nonce generated", 200);
	})

	.post("/verify", async (ctx) => {
		const { message, signature } = await ctx.req.json<{
			message: string;
			signature: Hex;
		}>();

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

		const msgData = nonces[address];
		delete nonces[address];

		if (!msgData || msgData.validTill < Date.now()) {
			return respond.err(ctx, "Nonce expired or not found", 400);
		}

		if (siweMessage.nonce !== msgData.nonce) {
			return respond.err(ctx, "Nonce mismatch", 400);
		}

		const valid = await verifySiweMessage(publicClient, {
			message,
			signature,
		});

		if (!valid) {
			return respond.err(ctx, "Invalid signature", 400);
		}

		await db
			.insert(users)
			.values({
				walletAddress: address,
				lastActiveAt: new Date(),
			})
			.onConflictDoNothing()
			.catch((err) => {
				console.error("Error inserting new user:", err);
				return respond.err(ctx, "Database error", 500);
			});

		const token = issueJwtToken(address);

		return respond.ok(ctx, { valid, token }, "Signature verified", 200);
	});

import { DAY } from "@pantha/shared/constants";
import { zEvmAddress } from "@pantha/shared/zod";
import { Hono } from "hono";
import z from "zod";
import { NotFoundError } from "../../../lib/errors";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";

const FAUCET_COOLDOWN_SECONDS = (1 * DAY) / 1000;
let decimals = -1;

export default new Hono().post(
	"/pantha",
	authenticated,
	validator("query", z.object({ address: zEvmAddress() })),
	async (ctx) => {
		const { db, contracts } = ctx.var.appState;
		const { address } = ctx.req.valid("query");

		const users = await db.userByWallet({ userWallet: address });
		if (!users) throw new NotFoundError("User not found");

		const redisKey = `faucet:last-claim${contracts.PanthaToken.address}:${address.toLowerCase()}`;
		const lastClaimStr = await db.redis.get(redisKey);

		if (lastClaimStr !== null) {
			const lastClaimTs = Number(lastClaimStr);
			const elapsedSeconds = Math.floor((Date.now() - lastClaimTs) / 1000);
			const remainingSeconds = FAUCET_COOLDOWN_SECONDS - elapsedSeconds;

			if (remainingSeconds > 0) {
				const hours = Math.floor(remainingSeconds / 3600);
				const minutes = Math.floor((remainingSeconds % 3600) / 60);
				const seconds = remainingSeconds % 60;

				return respond.ok(
					ctx,
					{
						claimed: false,
						waitSeconds: remainingSeconds,
						waitHuman: `${hours}h ${minutes}m ${seconds}s`,
					},
					"You can only claim once every 24 hours",
					200,
				);
			}
		}

		if (decimals === -1) {
			decimals = await contracts.PanthaToken.read.decimals();
		}

		const balance = await contracts.PanthaToken.read.balanceOf([address]);
		const txn = await contracts.PanthaToken.write.transfer([
			address,
			BigInt(100 * 10 ** decimals),
		]);

		await db.redis.setex(redisKey, FAUCET_COOLDOWN_SECONDS, String(Date.now()));

		return respond.ok(
			ctx,
			{
				claimed: true,
				txHash: txn,
				balanceBefore: balance.toString(),
			},
			"Tokens claimed successfully",
			200,
		);
	},
);

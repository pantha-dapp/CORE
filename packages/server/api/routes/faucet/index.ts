import { zEvmAddress } from "@pantha/shared/zod";
import { Hono } from "hono";
import z from "zod";
import { NotFoundError } from "../../../lib/errors";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";

export default new Hono().post(
	"/pantha",
	authenticated,
	validator("query", z.object({ address: zEvmAddress() })),
	async (ctx) => {
		const { db, contracts } = ctx.var.appState;
		const { address } = ctx.req.valid("query");

		const users = await db.userByWallet({ userWallet: address });
		if (!users) throw new NotFoundError("User not found");

		const txn = await contracts.PanthaToken.write.transfer([
			address,
			BigInt(100 * 10 ** 18), // 100 tokens with 18 decimals
		]);

		return respond.ok(ctx, { users }, "Users search completed", 200);
	},
);

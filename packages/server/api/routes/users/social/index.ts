import { tryCatch } from "@pantha/shared";
import { zHex } from "@pantha/shared/zod";
import { Hono } from "hono";
import z from "zod";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import type { RouterEnv } from "../../types";

export default new Hono<RouterEnv>().post(
	"/keygen",
	authenticated,
	validator(
		"json",
		z.object({
			seedSalt: zHex(),
			challengeSalt: zHex(),
			publicKey: zHex(),
			signature: zHex(),
		}),
	),
	async (ctx) => {
		const { contracts } = ctx.var.appState;
		const { seedSalt, challengeSalt, publicKey, signature } =
			ctx.req.valid("json");

		const txHash = await tryCatch(
			contracts.PanthaKeyStore.write.registerKeygenData([
				seedSalt,
				challengeSalt,
				publicKey,
				signature,
			]),
		);

		if (txHash.error) {
			console.error(
				"Failed to submit keygen data registration txn",
				txHash.error,
			);
			return respond.err(
				ctx,
				"Failed to submit keygen data registration txn",
				500,
			);
		}

		return respond.ok(
			ctx,
			{ txHash: txHash.data },
			"Keygen data registration txn submitted",
			201,
		);
	},
);

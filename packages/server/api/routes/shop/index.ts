import { identifierB8 } from "@pantha/contracts";
import { zHex } from "@pantha/shared/zod";
import { Hono } from "hono";
import { parseSignature } from "viem";
import z from "zod";
import { shopItems } from "../../../data/shop";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";

export default new Hono()

	.get("/", authenticated, async (ctx) => {
		respond.ok(ctx, { items: shopItems }, "Shop Items ", 200);
	})

	.post(
		"/buy",
		authenticated,
		validator("query", z.object({ itemId: z.string(), signature: zHex() })),
		async (ctx) => {
			const { contracts } = ctx.var.appState;
			const { itemId, signature } = ctx.req.valid("query");
			const item = shopItems.find((item) => item.id === itemId);
			if (!item) {
				return respond.err(ctx, "Item not found", 404);
			}

			const { v, r, s } = parseSignature(signature);
			if (!v) {
				return respond.err(ctx, "Invalid signature", 400);
			}

			const txHash = await contracts.PanthaShop.write.buyWithPermit([
				ctx.var.userWallet,
				BigInt(item.priceBps),
				BigInt(Date.now() + 10 * 60),
				Number(v),
				r,
				s,
				identifierB8(item.id),
			]);

			respond.ok(ctx, { txHash, itemId }, "Purchase request created", 201);
		},
	);

import { identifierB8 } from "@pantha/contracts";
import { zHex } from "@pantha/shared/zod";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { parseSignature } from "viem";
import z from "zod";
import { shopItems } from "../../../data/shop";
import { getContractVersionId } from "../../../lib/utils/contractVersion";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";

export default new Hono()

	.get("/", authenticated, async (ctx) => {
		return respond.ok(ctx, { items: shopItems }, "Shop Items ", 200);
	})

	.post(
		"/buy",
		authenticated,
		validator(
			"query",
			z.object({ itemId: z.string(), signature: zHex(), deadline: z.string() }),
		),
		async (ctx) => {
			const { contracts, db, policyManager } = ctx.var.appState;
			const { itemId, signature, deadline } = ctx.req.valid("query");

			await policyManager.assertCan(ctx.var.userWallet, "shop.purchase", {
				itemId,
			});

			const shopVersion = await getContractVersionId({
				db,
				type: "shop",
				contractAddress: contracts.PanthaShop.address,
			});

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
				BigInt(deadline),
				Number(v),
				r,
				s,
				identifierB8(item.id),
			]);

			contracts.$publicClient
				.waitForTransactionReceipt({ hash: txHash })
				.then((receipt) => {
					if (receipt.status === "success") {
						db.insert(db.schema.userPurchases).values({
							itemId,
							txHash,
							userWallet: ctx.var.userWallet,
							contractVersion: shopVersion,
							consumed: 0,
						});
					}
				});

			return respond.ok(
				ctx,
				{ txHash, itemId },
				"Purchase request created",
				201,
			);
		},
	)

	.get("/purchases", authenticated, async (ctx) => {
		const { db, contracts } = ctx.var.appState;

		const shopVersion = await getContractVersionId({
			db,
			type: "shop",
			contractAddress: contracts.PanthaShop.address,
		});

		const purchases = await ctx.var.appState.db
			.select()
			.from(ctx.var.appState.db.schema.userPurchases)
			.where(
				and(
					eq(
						ctx.var.appState.db.schema.userPurchases.userWallet,
						ctx.var.userWallet,
					),
					eq(
						ctx.var.appState.db.schema.userPurchases.contractVersion,
						shopVersion,
					),
				),
			);

		respond.ok(ctx, { history: purchases }, "Inventory Items ", 200);
	});

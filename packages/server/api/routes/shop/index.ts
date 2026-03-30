import { identifierB8 } from "@pantha/contracts";
import { zHex } from "@pantha/shared/zod";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { type Address, parseSignature } from "viem";
import z from "zod";
import tryCatchSync, { tryCatch } from "../../../../lib/shared/utils/tryCatch";
import { shopItems } from "../../../data/shop";
import { getContractVersionId } from "../../../lib/utils/contractVersion";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";
import type { RouterEnv } from "../types";

const processingPurchases: Record<Address, boolean> = {};
let panthaTokenDecimals = -1;

export default new Hono<RouterEnv>()

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

			if (panthaTokenDecimals === -1) {
				const decimals = await tryCatch(contracts.PanthaToken.read.decimals());
				if (decimals.error) {
					return respond.err(ctx, "Failed to fetch token decimals", 500);
				}
				panthaTokenDecimals = decimals.data;
			}

			await policyManager.assertCan(ctx.var.userWallet, "shop.purchase", {
				itemId,
			});

			if (processingPurchases[ctx.var.userWallet]) {
				return respond.err(
					ctx,
					"A purchase is already being processed for this wallet. Please wait.",
					429,
				);
			}

			const shopVersion = await getContractVersionId({
				db,
				type: "shop",
				contractAddress: contracts.PanthaShop.address,
			});

			const item = shopItems.find((item) => item.id === itemId);
			if (!item) {
				return respond.err(ctx, "Item not found", 404);
			}

			const parsedSignature = tryCatchSync(() => parseSignature(signature));
			if (parsedSignature.error) {
				return respond.err(ctx, "Invalid signature format", 400);
			}
			const { v, r, s } = parsedSignature.data;
			if (!v) {
				return respond.err(ctx, "Invalid signature", 400);
			}

			processingPurchases[ctx.var.userWallet] = true;
			const txHash = await contracts.PanthaShop.write.buyWithPermit([
				ctx.var.userWallet,
				BigInt(item.priceHuman * 10 ** panthaTokenDecimals),
				BigInt(deadline),
				Number(v),
				r,
				s,
				identifierB8(item.id),
			]);

			// Insert optimistically so the purchase is available immediately.
			// If the transaction reverts on-chain, the record is deleted.
			const insertion = await tryCatch(
				db.insert(db.schema.userPurchases).values({
					itemId,
					txHash,
					userWallet: ctx.var.userWallet,
					contractVersion: shopVersion,
					consumed: 0,
				}),
			);
			if (insertion.error) {
				console.error("Failed to record purchase:", insertion.error);
			}

			contracts.$publicClient
				.waitForTransactionReceipt({ hash: txHash })
				.then(async (receipt) => {
					if (receipt.status !== "success") {
						await tryCatch(
							db
								.delete(db.schema.userPurchases)
								.where(eq(db.schema.userPurchases.txHash, txHash)),
						);
					}
				})
				.finally(() => {
					processingPurchases[ctx.var.userWallet] = false;
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
			.select({
				itemId: ctx.var.appState.db.schema.userPurchases.itemId,
				consumed: ctx.var.appState.db.schema.userPurchases.consumed,
				purchasedAt: ctx.var.appState.db.schema.userPurchases.purchasedAt,
			})
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
		return respond.ok(ctx, { history: purchases }, "Inventory Items ", 200);
	});

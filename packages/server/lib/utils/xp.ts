import { bytes8, identifierB8 } from "@pantha/contracts";
import { tryCatch } from "@pantha/shared";
import { and, eq, gt, inArray } from "drizzle-orm";
import type { Address } from "viem";
import type { AppState } from "../../api/routes/types";
import {
	XP_MULTIPLIER_DURATION_MS,
	XP_MULTIPLIER_ITEMS,
	type XpMultiplierItemId,
} from "../../data/shop";
import { getContractVersionId } from "./contractVersion";

interface MintXpParams {
	walletAddress: Address;
	chapterId: string;
	xpAmount: number;
	contractsEventName: string;
	appState: AppState;
}

async function getActiveXpMultiplier(
	walletAddress: Address,
	db: AppState["db"],
): Promise<number> {
	const [activePurchase] = await db
		.select()
		.from(db.schema.userPurchases)
		.where(
			and(
				eq(db.schema.userPurchases.userWallet, walletAddress),
				inArray(
					db.schema.userPurchases.itemId,
					Object.keys(XP_MULTIPLIER_ITEMS),
				),
				eq(db.schema.userPurchases.consumed, 0),
				gt(
					db.schema.userPurchases.purchasedAt,
					new Date(Date.now() - XP_MULTIPLIER_DURATION_MS),
				),
			),
		)
		.limit(1);

	if (!activePurchase) return 1;
	return XP_MULTIPLIER_ITEMS[activePurchase.itemId as XpMultiplierItemId] ?? 1;
}

export async function mintXpForChapter({
	walletAddress,
	chapterId,
	xpAmount,
	contractsEventName,
	appState,
}: MintXpParams) {
	const { db, contracts } = appState;

	const multiplier = await getActiveXpMultiplier(walletAddress, db);
	const effectiveXpAmount = Math.floor(xpAmount * multiplier);

	const pxpVersion = await getContractVersionId({
		db,
		type: "pxp",
		contractAddress: contracts.PanthaOrchestrator.address,
	});

	const user = await db.userByWallet({ userWallet: walletAddress });
	if (!user) return;

	const { data: hash, error: contractError } = await tryCatch(
		contracts.PanthaOrchestrator.write.mintXp([
			user.walletAddress,
			BigInt(effectiveXpAmount),
			bytes8(contractsEventName),
			identifierB8(chapterId),
		]),
	);

	if (contractError || !hash) {
		console.error("Erro minting xp", contractError);
		return;
	}

	const [xpLog] = await db
		.insert(db.schema.userXpLog)
		.values({
			userWallet: walletAddress,
			xpGained: effectiveXpAmount,
			transactionHash: hash,
			status: "pending",
			contractVersion: pxpVersion,
		})
		.returning();
	if (!xpLog) return;

	contracts.$publicClient
		.waitForTransactionReceipt({ hash })
		.then((receipt) => {
			if (receipt.status === "success") {
				return db
					.update(db.schema.userXpLog)
					.set({ status: "success" })
					.where(eq(db.schema.userXpLog.id, xpLog.id));
			} else {
				return db
					.update(db.schema.userXpLog)
					.set({ status: "failed" })
					.where(eq(db.schema.userXpLog.id, xpLog.id));
			}
		})
		.catch((e) => {
			console.error("Error waiting for transaction receipt", e);
			return db
				.update(db.schema.userXpLog)
				.set({ status: "failed" })
				.where(eq(db.schema.userXpLog.id, xpLog.id));
		});
}

import { bytes8, identifierB8 } from "@pantha/contracts";
import { eq } from "drizzle-orm";
import type { Address } from "viem";
import type { AppState } from "../../api/routes/types";

interface MintXpParams {
	walletAddress: Address;
	chapterId: string;
	xpAmount: number;
	xpLogValue: number;
	contractsEventName: string;
	appState: AppState;
}

export async function mintXpForChapter({
	walletAddress,
	chapterId,
	xpAmount,
	xpLogValue,
	contractsEventName,
	appState,
}: MintXpParams) {
	const { db, contracts } = appState;

	const user = await db.userByWallet({ userWallet: walletAddress });
	if (!user) return;

	const hash = await contracts.PanthaOrchestrator.write.mintXp([
		user.walletAddress,
		BigInt(xpAmount) * 10n ** 18n,
		bytes8(contractsEventName),
		identifierB8(chapterId),
	]);

	const [xpLog] = await db
		.insert(db.schema.userXpLog)
		.values({
			userWallet: walletAddress,
			xpGained: xpLogValue,
			transactionHash: hash,
		})
		.returning();
	if (!xpLog) return;

	contracts.$publicClient
		.waitForTransactionReceipt({ hash })
		.then((receipt) => {
			if (receipt.status === "success") {
				db.update(db.schema.userXpLog)
					.set({ success: true })
					.where(eq(db.schema.userXpLog.id, xpLog.id));
			} else {
				db.delete(db.schema.userXpLog).where(
					eq(db.schema.userXpLog.id, xpLog.id),
				);
			}
		})
		.catch(() => {
			db.delete(db.schema.userXpLog).where(
				eq(db.schema.userXpLog.id, xpLog.id),
			);
		});
}

import { bytes8, identifierB8 } from "@pantha/contracts";
import { tryCatch } from "@pantha/shared";
import { eq } from "drizzle-orm";
import type { Address } from "viem";
import type { AppState } from "../../api/routes/types";

interface MintXpParams {
	walletAddress: Address;
	chapterId: string;
	xpAmount: number;
	contractsEventName: string;
	appState: AppState;
}

export async function mintXpForChapter({
	walletAddress,
	chapterId,
	xpAmount,
	contractsEventName,
	appState,
}: MintXpParams) {
	const { db, contracts } = appState;

	const user = await db.userByWallet({ userWallet: walletAddress });
	if (!user) return;

	const { data: hash, error: contractError } = await tryCatch(
		contracts.PanthaOrchestrator.write.mintXp([
			user.walletAddress,
			BigInt(xpAmount),
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
			xpGained: xpAmount,
			transactionHash: hash,
			status: "pending",
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

import { createNFTMetadata, metadataToBuffer } from "@pantha/contracts";
import { tryCatch } from "@pantha/shared";
import { and, eq, sql } from "drizzle-orm";
import { type Address, parseEventLogs, zeroAddress } from "viem";
import type { AppState } from "../../api/routes/types";
import { computeMerkleRoot } from "./merkle";

interface IssueCertificateParams {
	userWallet: Address;
	courseId: string;
	appState: AppState;
}

export async function issueCertificate({
	userWallet,
	courseId,
	appState,
}: IssueCertificateParams): Promise<void> {
	const { db, ai, contracts, objectStorage } = appState;

	const [user, course, chaptersAll] = await Promise.all([
		db.userByWallet({ userWallet }),
		db.courseById({ courseId }),
		db.courseChaptersById({ courseId }),
	]);

	if (!user) throw new Error(`User with wallet ${userWallet} not found`);
	if (!course) throw new Error(`Course ${courseId} not found`);
	if (chaptersAll.length === 0)
		throw new Error(`Course ${courseId} has no chapters`);

	const [enrollment] = await db
		.select()
		.from(db.schema.userCourses)
		.where(
			and(
				eq(db.schema.userCourses.userWallet, userWallet),
				eq(db.schema.userCourses.courseId, courseId),
			),
		);
	if (!enrollment)
		throw new Error(
			`Enrollment not found for user ${userWallet} in course ${courseId}`,
		);

	const { progress } = enrollment;

	const actionChain = await db
		.select()
		.from(db.schema.userActions)
		.where(eq(db.schema.userActions.userWallet, userWallet))
		.orderBy(sql`rowid`);

	const merkleRoot = computeMerkleRoot(actionChain.map((a) => a.hash));

	const { data: commitHash, error: commitError } = await tryCatch(
		contracts.PanthaOrchestrator.write.commitActionChainRoot([
			userWallet,
			merkleRoot,
		]),
	);

	if (commitError || !commitHash) {
		throw new Error(
			`Failed to commit action chain root on-chain: ${commitError?.message}`,
		);
	}

	const commitReceipt = await contracts.$publicClient.waitForTransactionReceipt(
		{
			hash: commitHash,
		},
	);
	if (commitReceipt.status !== "success") {
		throw new Error(`commitActionChainRoot transaction failed: ${commitHash}`);
	}

	const aiMetadata = await ai.llm.generateCertificationDetails({
		course: {
			title: course.title,
			description: course.description,
			topics: course.topics,
		},
		chaptersCompleted: chaptersAll
			.filter((c) => c.order <= progress)
			.map((c) => ({ title: c.title, description: c.description })),
	});

	const hashchainPathProps = [userWallet, `${Date.now()}`];

	console.log(JSON.stringify(actionChain));

	const hashchainUpload = objectStorage.upload({
		path: ["action-hash-chain", ...hashchainPathProps],
		data: Buffer.from(JSON.stringify(actionChain)),
	});

	const { url: hashchainUri } = await hashchainUpload.persistentStorage;
	hashchainUpload.hotStorage.then(() =>
		objectStorage.unloadHot({
			path: ["action-hash-chain", ...hashchainPathProps],
		}),
	);

	const nftMetadata = createNFTMetadata({
		name: `${Math.round((progress / chaptersAll.length) * 100)}% ${aiMetadata.title} Certification`,
		description: aiMetadata.description,
		image: "ipfs://example-image-url", // TODO: generate image and upload to IPFS
		attributes: [
			{ trait_type: "hashchainUrl", value: hashchainUri },
			{ trait_type: "issuedTo", value: userWallet },
			{ trait_type: "panthaUsername", value: user.username },
			{ trait_type: "panthaCourseId", value: courseId },
			{ trait_type: "merkleRoot", value: merkleRoot },
			{ trait_type: "progress", value: progress },
			{ trait_type: "totalChapters", value: chaptersAll.length },
		],
	});

	const metadataPathProps = [userWallet, courseId, `${Date.now()}`];
	const metadataUpload = objectStorage.upload({
		path: ["certification-metadata", ...metadataPathProps],
		data: metadataToBuffer(nftMetadata),
	});

	const { url: metadataUri } = await metadataUpload.persistentStorage;
	metadataUpload.hotStorage.then(() =>
		objectStorage.unloadHot({
			path: ["certification-metadata", ...metadataPathProps],
		}),
	);

	const { data: certifyHash, error: certifyError } = await tryCatch(
		contracts.PanthaOrchestrator.write.certify([userWallet, metadataUri]),
	);

	if (certifyError || !certifyHash) {
		throw new Error(
			`Failed to request certification on-chain: ${certifyError?.message}`,
		);
	}

	const certifyReceipt =
		await contracts.$publicClient.waitForTransactionReceipt({
			hash: certifyHash,
		});
	if (certifyReceipt.status !== "success") {
		throw new Error(`Certification transaction failed: ${certifyHash}`);
	}

	const transferLogs = parseEventLogs({
		abi: contracts.PanthaCertificate.abi,
		logs: certifyReceipt.logs,
		eventName: "Transfer",
	});
	const mintLog = transferLogs.find((log) => log.args.from === zeroAddress);
	if (!mintLog) {
		throw new Error("Transfer event not found in certify receipt");
	}
	const tokenId = mintLog.args.tokenId;

	await db
		.update(db.schema.userPurchases)
		.set({ consumed: 1 })
		.where(
			and(
				eq(db.schema.userPurchases.userWallet, userWallet),
				eq(db.schema.userPurchases.itemId, "CERTIFCT"),
				eq(db.schema.userPurchases.consumed, 0),
			),
		);

	await db.insert(db.schema.userCertificates).values({
		userWallet,
		txnHash: certifyHash,
		dataUri: metadataUri,
		tokenId: tokenId.toString(),
	});
}

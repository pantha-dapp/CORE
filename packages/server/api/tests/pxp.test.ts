import { describe, expect, it } from "bun:test";
import { desc, eq } from "drizzle-orm";
import { testGlobals } from "./helpers/globals";
import { unwrap } from "./helpers/rpc";
import { userWallet1 } from "./helpers/setup";
import { testCompleteChapter, testCreateCourse } from "./helpers/testHelpers";

describe("Xp minting", async () => {
	const { api1 } = testGlobals;
	const courseId = await testCreateCourse(api1);
	const res = await api1.courses[":id"].chapters.$get({
		param: { id: courseId },
	});
	const courseData = await res.json();
	if (!courseData.success || !courseData.data.chapters[0]) {
		throw new Error("Failed to fetch course chapters");
	}

	const chapterId = courseData.data.chapters[0].id;
	let firstXpCount: number = 0;
	it("should award XP instantly when a chapter is completed", async () => {
		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		const initialXp = userBefore.xpCount;

		expect(initialXp).toBeNumber();
		firstXpCount = initialXp;

		await testCompleteChapter(chapterId, api1);
		await Bun.sleep(50);

		const { user: userAfter } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		const finalXp = userAfter.xpCount;

		expect(finalXp).toBeGreaterThan(initialXp);
	});

	it("should kepp XP after txn settlement", async () => {
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const { user } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		const finalXp = user.xpCount;

		expect(finalXp).toBeGreaterThan(firstXpCount);
	});

	it("Should track txn status in db", async () => {
		const { db, contracts } = testGlobals.appState;

		await contracts.$$testClient.setAutomine(false);
		await testCompleteChapter(chapterId, api1);
		await Bun.sleep(50);

		const records = await db
			.select()
			.from(db.schema.userXpLog)
			.orderBy(desc(db.schema.userXpLog.createdAt));
		const recordBefore = records[0];

		expect(recordBefore?.status).toBe("pending");

		if (!recordBefore) {
			throw new Error("No record found in userXpLog");
		}
		if (!recordBefore.transactionHash) {
			throw new Error("No transaction hash found in userXpLog record");
		}

		await contracts.$$testClient.setAutomine(true);
		await contracts.$$testClient.mine({ blocks: 1 });
		await contracts.$publicClient.waitForTransactionReceipt({
			hash: recordBefore.transactionHash,
		});

		const [recordAfter] = await db
			.select()
			.from(db.schema.userXpLog)
			.where(eq(db.schema.userXpLog.id, recordBefore.id));

		expect(recordAfter).toBeDefined();
		expect(recordAfter?.status).toBe("success");
	});
});

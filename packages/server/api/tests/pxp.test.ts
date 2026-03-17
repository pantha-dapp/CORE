import { describe, expect, it } from "bun:test";
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
});

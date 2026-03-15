import { beforeAll, describe, expect, it } from "bun:test";
import { testGlobals } from "./helpers/globals";
import { userWallet1 } from "./helpers/setup";
import { testCompleteChapter, testCreateCourse } from "./helpers/testHelpers";

describe("User Streaks", () => {
	let api1: typeof testGlobals.api1;
	let courseId: string;
	let chapterId: string;

	beforeAll(async () => {
		api1 = testGlobals.api1;
		courseId = await testCreateCourse(api1);

		await api1.courses.enroll.$post({
			json: { courseId },
		});

		const chaptersRes = await api1.courses[":id"].chapters.$get({
			param: { id: courseId },
		});
		const chaptersData = await chaptersRes.json();
		if (!chaptersData.success) throw new Error("Failed to fetch chapters");
		const chapter = chaptersData.data.chapters[0];
		if (!chapter?.id) throw new Error("No chapters found");
		chapterId = chapter.id;
	});

	// DAY 0
	it("streak is 1 after the first day's activity", async () => {
		const userResBefore = await api1.users[":wallet"].$get({
			param: { wallet: userWallet1.account.address },
		});
		const userDataBefore = await userResBefore.json();
		if (!userDataBefore.success) {
			throw new Error("Failed to fetch user data");
		}
		const { user: userBefore } = userDataBefore.data;

		expect(userBefore.streak.currentStreak).toBe(0);

		await testCompleteChapter(chapterId, api1);

		const userRes = await api1.users[":wallet"].$get({
			param: { wallet: userWallet1.account.address },
		});
		const userData = await userRes.json();
		if (!userData.success) {
			throw new Error("Failed to fetch user data");
		}
		const { user } = userData.data;

		expect(user.streak.currentStreak).toBe(1);
	});

	it("duplicate activity on the same day does NOT increment the streak", async () => {
		const { api1 } = testGlobals;
		const userResBefore = await api1.users[":wallet"].$get({
			param: { wallet: userWallet1.account.address },
		});
		const userDataBefore = await userResBefore.json();
		if (!userDataBefore.success) {
			throw new Error("Failed to fetch user data");
		}
		const { user: userBefore } = userDataBefore.data;

		expect(userBefore.streak.currentStreak).toBe(1);

		await testCompleteChapter(chapterId, api1);

		const userResAfter = await api1.users[":wallet"].$get({
			param: { wallet: userWallet1.account.address },
		});
		const userDataAfter = await userResAfter.json();
		if (!userDataAfter.success) {
			throw new Error("Failed to fetch user data");
		}
		const { user: userAfter } = userDataAfter.data;

		// Streak should still be 1, not incremented by the duplicate activity
		expect(userAfter.streak.currentStreak).toBe(1);
	});

	// // Day 1 - consecutive
	// it("streak increments to 2 on the next consecutive day", async () => {
	// 	setSystemTime(DAY_0 + ONE_DAY_MS); // 2025-06-16

	// 	await registerActivityForStreaks(db, WALLET);

	// 	const [streak] = await db
	// 		.select()
	// 		.from(db.schema.userStreaks)
	// 		.where(eq(db.schema.userStreaks.userId, WALLET));

	// 	expect(streak?.currentStreak).toBe(2);
	// 	expect(streak?.lastActiveDate).toBe("2025-06-16");

	// 	setSystemTime();
	// });

	// // Day 3 - skipped day 2, streak should reset
	// it("streak resets to 1 when a day is skipped", async () => {
	// 	// Skip 2025-06-17 entirely, jump straight to 2025-06-18
	// 	setSystemTime(DAY_0 + 3 * ONE_DAY_MS);

	// 	await registerActivityForStreaks(db, WALLET);

	// 	const [streak] = await db
	// 		.select()
	// 		.from(db.schema.userStreaks)
	// 		.where(eq(db.schema.userStreaks.userId, WALLET));

	// 	expect(streak?.currentStreak).toBe(1);
	// 	expect(streak?.lastActiveDate).toBe("2025-06-18");

	// 	setSystemTime();
	// });

	// // Day 4 - consecutive again, streak should build back up
	// it("streak builds back up to 2 after a reset when consecutive again", async () => {
	// 	setSystemTime(DAY_0 + 4 * ONE_DAY_MS); // 2025-06-19

	// 	await registerActivityForStreaks(db, WALLET);

	// 	const [streak] = await db
	// 		.select()
	// 		.from(db.schema.userStreaks)
	// 		.where(eq(db.schema.userStreaks.userId, WALLET));

	// 	expect(streak?.currentStreak).toBe(2);

	// 	setSystemTime();
	// });
});

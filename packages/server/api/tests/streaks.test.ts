import {
	afterAll,
	beforeAll,
	describe,
	expect,
	it,
	setSystemTime,
} from "bun:test";
import { testGlobals } from "./helpers/globals";
import { unwrap } from "./helpers/rpc";
import { userWallet1 } from "./helpers/setup";
import {
	testBecomeFriends,
	testCompleteChapter,
	testCreateCourse,
} from "./helpers/testHelpers";

const DAY_0 = Date.now();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe("User Streaks", () => {
	let courseId: string;
	let chapterId: string;

	beforeAll(async () => {
		const { api1 } = testGlobals;
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

	afterAll(() => {
		setSystemTime();
	});

	// DAY 0
	it("streak is 1 after the first day's activity", async () => {
		const { api1 } = testGlobals;

		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userBefore.streak.currentStreak).toBe(0);

		await testCompleteChapter(chapterId, api1);

		const { user } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(user.streak.currentStreak).toBe(1);
	});

	it("more activity on the same day does NOT increse the streak", async () => {
		const { api1 } = testGlobals;
		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userBefore.streak.currentStreak).toBe(1);

		await testCompleteChapter(chapterId, api1);

		const { user: userAfter } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userAfter.streak.currentStreak).toBe(1);
	});

	// Day 1 - consecutive
	it("streak increments to 2 on the next consecutive day", async () => {
		setSystemTime(DAY_0 + ONE_DAY_MS);
		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;

		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userBefore.streak.currentStreak).toBe(1);

		await testCompleteChapter(chapterId, api1);

		const { user: userAfter } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userAfter.streak.currentStreak).toBe(2);
	});

	// Day 2 - miss activity but retain streak
	it("streak stays the same for an entire day - retained when missing activity", async () => {
		setSystemTime(DAY_0 + 2 * ONE_DAY_MS);

		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;
		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userBefore.streak.currentStreak).toBe(2);
	});

	// Day 3 - missed previous day, the streak rests
	it("streak resets to 1 after missing a day", async () => {
		setSystemTime(DAY_0 + 3 * ONE_DAY_MS);

		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;

		await testCompleteChapter(chapterId, api1);

		const { user: userAfter } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		expect(userAfter.streak.currentStreak).toBe(1);
	});
});

describe("Friends Streaks", () => {
	let courseId: string;
	let chapterId: string;

	beforeAll(async () => {
		const { api1, api2 } = testGlobals;
		courseId = await testCreateCourse(api1);

		await testBecomeFriends(api1, api2);

		await api1.courses.enroll.$post({
			json: { courseId },
		});

		await api2.courses.enroll.$post({
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

	afterAll(() => {
		setSystemTime();
	});

	// DAY 0
	it("streak is 1 after both do first day's activity", async () => {
		const { api1, api2 } = testGlobals;

		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userBefore.streak.currentStreak).toBe(0);

		await testCompleteChapter(chapterId, api1);

		const { user } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(user.streak.currentStreak).toBe(1);
	});

	it("more activity on the same day does NOT increse the streak", async () => {
		const { api1 } = testGlobals;
		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userBefore.streak.currentStreak).toBe(1);

		await testCompleteChapter(chapterId, api1);

		const { user: userAfter } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userAfter.streak.currentStreak).toBe(1);
	});

	// Day 1 - consecutive
	it("streak increments to 2 on the next consecutive day", async () => {
		setSystemTime(DAY_0 + ONE_DAY_MS);
		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;

		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userBefore.streak.currentStreak).toBe(1);

		await testCompleteChapter(chapterId, api1);

		const { user: userAfter } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userAfter.streak.currentStreak).toBe(2);
	});

	// Day 2 - miss activity but retain streak
	it("streak stays the same for an entire day - retained when missing activity", async () => {
		setSystemTime(DAY_0 + 2 * ONE_DAY_MS);

		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;
		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		expect(userBefore.streak.currentStreak).toBe(2);
	});

	// Day 3 - missed previous day, the streak rests
	it("streak resets to 1 after missing a day", async () => {
		setSystemTime(DAY_0 + 3 * ONE_DAY_MS);

		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;

		await testCompleteChapter(chapterId, api1);

		const { user: userAfter } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		expect(userAfter.streak.currentStreak).toBe(1);
	});
});

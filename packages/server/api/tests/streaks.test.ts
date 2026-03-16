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
import { userWallet1, userWallet2 } from "./helpers/setup";
import {
	testBecomeFriends,
	testCompleteChapter,
	testCreateCourse,
} from "./helpers/testHelpers";

const DAY_0 = Date.now();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Snap to noon UTC 14 days out so tests never straddle a midnight boundary
const NOON_UTC_MS = 12 * 60 * 60 * 1000;
const FRIENDS_DAY_0_BASE =
	DAY_0 - (DAY_0 % ONE_DAY_MS) + 14 * ONE_DAY_MS + NOON_UTC_MS;

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
		testGlobals.reauthenticate();
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
	const FRIENDS_DAY_0 = FRIENDS_DAY_0_BASE;

	beforeAll(async () => {
		setSystemTime(FRIENDS_DAY_0);
		await testGlobals.reauthenticate();

		const { api1, api2 } = testGlobals;
		courseId = await testCreateCourse(api1);

		await testBecomeFriends(api1, api2);

		await api1.courses.enroll.$post({ json: { courseId } });
		await api2.courses.enroll.$post({ json: { courseId } });

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
		testGlobals.reauthenticate();
	});

	const getFriendStreak = async () => {
		const { friends } = await unwrap(
			testGlobals.api1.users[":wallet"].friends.$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		return (
			friends.find((f) => f.wallet === userWallet2.account.address)?.streak ?? {
				currentStreak: 0,
				lastActiveDate: null,
			}
		);
	};

	// DAY 0
	it("friend streak is 0 before any mutual activity", async () => {
		const streak = await getFriendStreak();
		expect(streak.currentStreak).toBe(0);
	});

	it("friend streak stays 0 after only one user is active", async () => {
		await testCompleteChapter(chapterId, testGlobals.api1);
		await sleep(50);
		const streak = await getFriendStreak();
		expect(streak.currentStreak).toBe(0);
	});

	it("friend streak becomes 1 after both are active on the same day", async () => {
		await testCompleteChapter(chapterId, testGlobals.api2);
		await sleep(50);
		const streak = await getFriendStreak();
		expect(streak.currentStreak).toBe(1);
	});

	it("additional activity on the same day does NOT increase friend streak", async () => {
		await testCompleteChapter(chapterId, testGlobals.api1);
		await testCompleteChapter(chapterId, testGlobals.api2);
		await sleep(50);
		const streak = await getFriendStreak();
		expect(streak.currentStreak).toBe(1);
	});

	// DAY 1 - consecutive
	it("friend streak increments to 2 when both are active on the next consecutive day", async () => {
		setSystemTime(FRIENDS_DAY_0 + ONE_DAY_MS);
		await testGlobals.reauthenticate();
		await testCompleteChapter(chapterId, testGlobals.api1);
		await testCompleteChapter(chapterId, testGlobals.api2);
		await sleep(50);
		const streak = await getFriendStreak();
		expect(streak.currentStreak).toBe(2);
	});

	// DAY 2 - only one user active
	it("friend streak does not change when only one user is active", async () => {
		setSystemTime(FRIENDS_DAY_0 + 2 * ONE_DAY_MS);
		await testGlobals.reauthenticate();
		await testCompleteChapter(chapterId, testGlobals.api1);
		await sleep(50);
		const streak = await getFriendStreak();
		expect(streak.currentStreak).toBe(2);
	});

	// DAY 3 - both active but day 2 was missed for api2
	it("friend streak resets to 1 after a missed shared day", async () => {
		setSystemTime(FRIENDS_DAY_0 + 3 * ONE_DAY_MS);
		await testGlobals.reauthenticate();
		await testCompleteChapter(chapterId, testGlobals.api1);
		await testCompleteChapter(chapterId, testGlobals.api2);
		await sleep(50);
		const streak = await getFriendStreak();
		expect(streak.currentStreak).toBe(1);
	});
});

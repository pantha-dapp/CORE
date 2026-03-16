import {
	afterAll,
	beforeAll,
	describe,
	expect,
	it,
	setSystemTime,
} from "bun:test";
import { parseResponse } from "hono/client";
import { testGlobals } from "./helpers/globals";
import { rpc } from "./helpers/rpc";
import { userWallet1 } from "./helpers/setup";
import { testCompleteChapter, testCreateCourse } from "./helpers/testHelpers";

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

	it("more activity on the same day does NOT increse the streak", async () => {
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

		expect(userAfter.streak.currentStreak).toBe(1);
	});

	// Day 1 - consecutive
	it("streak increments to 2 on the next consecutive day", async () => {
		setSystemTime(DAY_0 + ONE_DAY_MS);
		await testGlobals.reauthenticate();
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

		expect(userAfter.streak.currentStreak).toBe(2);
	});

	// Day 2 - miss activity but retain streak
	it("streak stays the same for an entire day - retained when missing activity", async () => {
		setSystemTime(DAY_0 + 2 * ONE_DAY_MS);

		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;
		const userResBefore = await api1.users[":wallet"].$get({
			param: { wallet: userWallet1.account.address },
		});
		const userDataBefore = await userResBefore.json();
		if (!userDataBefore.success) {
			throw new Error("Failed to fetch user data");
		}
		const { user: userBefore } = userDataBefore.data;

		expect(userBefore.streak.currentStreak).toBe(2);
	});

	// Day 3 - missed previous day, the streak rests
	it("streak resets to 1 after missing a day", async () => {
		setSystemTime(DAY_0 + 3 * ONE_DAY_MS);

		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;

		await testCompleteChapter(chapterId, api1);

		const userRes = await parseResponse(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		if (!userRes.success) {
			throw new Error("Failed to fetch user data");
		}
		const { user: userAfter } = userRes.data;
		expect(userAfter.streak.currentStreak).toBe(1);
	});
});

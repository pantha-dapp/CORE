import { beforeAll, describe, expect, it } from "bun:test";
import { testGlobals } from "./helpers/globals";
import { unwrap } from "./helpers/rpc";
import { userWallet1, userWallet2 } from "./helpers/setup";
import {
	testBecomeFriends,
	testCompleteChapter,
	testCreateCourse,
} from "./helpers/testHelpers";

describe("Leaderboard", () => {
	beforeAll(async () => {
		const { api1, api2 } = testGlobals;

		// Make sure they're not already friends so the friends leaderboard starts empty
		await api1.users.unfollow.$post({
			json: { walletToUnfollow: userWallet2.account.address },
		});
		await api2.users.unfollow.$post({
			json: { walletToUnfollow: userWallet1.account.address },
		});

		// Give both users XP via course completion
		const [courseId1, courseId2] = await Promise.all([
			testCreateCourse(api1),
			testCreateCourse(api2),
		]);

		await Promise.all([
			api1.courses.enroll.$post({ json: { courseId: courseId1 } }),
			api2.courses.enroll.$post({ json: { courseId: courseId2 } }),
		]);

		const [chapters1Res, chapters2Res] = await Promise.all([
			api1.courses[":id"].chapters.$get({ param: { id: courseId1 } }),
			api2.courses[":id"].chapters.$get({ param: { id: courseId2 } }),
		]);

		const chapters1Data = await chapters1Res.json();
		const chapters2Data = await chapters2Res.json();
		if (!chapters1Data.success || !chapters2Data.success)
			throw new Error("Failed to fetch chapters");

		const chapter1 = chapters1Data.data.chapters[0];
		const chapter2 = chapters2Data.data.chapters[0];
		if (!chapter1?.id || !chapter2?.id) throw new Error("No chapters found");

		// Complete chapters sequentially — concurrent mints from the same deployer
		// account cause nonce collisions on the local Hardhat node.
		await testCompleteChapter(chapter1.id, api1, userWallet1);
		await new Promise((r) => setTimeout(r, 500));
		await testCompleteChapter(chapter2.id, api2, userWallet2);

		// Allow background XP minting to settle before tests run
		await new Promise((r) => setTimeout(r, 3000));
	}, 120_000);

	describe("Weekly leaderboard", () => {
		it("returns a successful response with leaderboard array", async () => {
			const { api1 } = testGlobals;
			const { leaderboard } = await unwrap(
				api1.users.social.leaderboard.weekly.$get(),
			);
			expect(Array.isArray(leaderboard)).toBe(true);
		});

		it("each entry has userWallet, totalXp and rank fields", async () => {
			const { api1 } = testGlobals;
			const { leaderboard } = await unwrap(
				api1.users.social.leaderboard.weekly.$get(),
			);
			for (const entry of leaderboard) {
				expect(typeof entry.userWallet).toBe("string");
				expect(typeof entry.totalXp).toBe("number");
				expect(typeof entry.rank).toBe("number");
			}
		});

		it("user who earned XP appears in the weekly leaderboard", async () => {
			const { api1 } = testGlobals;
			const { leaderboard } = await unwrap(
				api1.users.social.leaderboard.weekly.$get(),
			);
			const entry = leaderboard.find(
				(e) => e.userWallet === userWallet1.account.address,
			);
			expect(entry).toBeDefined();
			if (!entry) throw new Error("Entry not found");
			expect(entry.totalXp).toBeGreaterThan(0);
		});

		it("ranks are positive integers starting from 1", async () => {
			const { api1 } = testGlobals;
			const { leaderboard } = await unwrap(
				api1.users.social.leaderboard.weekly.$get(),
			);
			for (const entry of leaderboard) {
				expect(entry.rank).toBeGreaterThanOrEqual(1);
			}
		});
	});

	describe("Friends leaderboard", () => {
		it("returns empty leaderboard when user has no friends", async () => {
			const { api1 } = testGlobals;
			const { leaderboard } = await unwrap(
				api1.users.social.leaderboard.friends.$get(),
			);
			expect(leaderboard).toEqual([]);
		});

		it("shows friends after they become friends", async () => {
			const { api1, api2 } = testGlobals;

			await testBecomeFriends(api1, api2);

			const { leaderboard } = await unwrap(
				api1.users.social.leaderboard.friends.$get(),
			);

			expect(leaderboard.length).toBeGreaterThan(0);
			const entry = leaderboard.find(
				(e) => e.userWallet === userWallet2.account.address,
			);
			expect(entry).toBeDefined();
			if (!entry) throw new Error("Entry not found");
			expect(entry.totalXp).toBeGreaterThan(0);
		});

		it("entries are ordered by totalXp descending", async () => {
			const { api1 } = testGlobals;
			const { leaderboard } = await unwrap(
				api1.users.social.leaderboard.friends.$get(),
			);
			for (let i = 1; i < leaderboard.length; i++) {
				const prev = leaderboard[i - 1];
				const curr = leaderboard[i];
				if (!prev || !curr) throw new Error("Unexpected undefined entry");
				expect(prev.totalXp).toBeGreaterThanOrEqual(curr.totalXp);
			}
		});
	});
});

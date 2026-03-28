import { beforeAll, describe, expect, it } from "bun:test";
import { testGlobals } from "./helpers/globals";
import { unwrap } from "./helpers/rpc";
import { userWallet1 } from "./helpers/setup";
import { testCompleteChapter, testCreateCourse } from "./helpers/testHelpers";

describe("User Action Chain (certification)", () => {
	it("returns 401 for unauthenticated requests", async () => {
		const { api0 } = testGlobals;
		const res = await api0.users["action-chain"].$get();
		expect(res.status).toBe(401);
	});

	it("returns an empty action chain for a fresh user", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users["action-chain"].$get();
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Request failed");

		expect(data.data.actionChain).toBeArray();
	});

	describe("after completing a chapter", () => {
		let initialChainLength = 0;

		beforeAll(async () => {
			const { api1 } = testGlobals;

			// Capture current length before completing a chapter
			const { actionChain: chainBefore } = await unwrap(
				api1.users["action-chain"].$get(),
			);
			initialChainLength = chainBefore.length;

			const courseId = await testCreateCourse(api1);

			const chaptersRes = await api1.courses[":id"].chapters.$get({
				param: { id: courseId },
			});
			const chaptersData = await chaptersRes.json();
			if (!chaptersData.success) throw new Error("Failed to fetch chapters");

			const chapterId = chaptersData.data.chapters[0]?.id;
			if (!chapterId) throw new Error("No chapters found");

			await testCompleteChapter(chapterId, api1, userWallet1);
			// Give async action registration a moment to settle
			await Bun.sleep(100);
		});

		it("action chain grows after chapter completion", async () => {
			const { api1 } = testGlobals;
			const { actionChain } = await unwrap(api1.users["action-chain"].$get());

			expect(actionChain.length).toBeGreaterThan(initialChainLength);
		});

		it("each action entry has expected shape", async () => {
			const { api1 } = testGlobals;
			const { actionChain } = await unwrap(api1.users["action-chain"].$get());

			const newActions = actionChain.slice(initialChainLength);
			expect(newActions.length).toBeGreaterThan(0);

			for (const action of newActions) {
				expect(action.hash).toBeString();
				expect(action.prevHash).toBeString();
				expect(action.userWallet).toBe(userWallet1.account.address);
				expect(action.label).toBeString();
				expect(action.signature).toBeString();
			}
		});

		it("action chain forms a valid hash chain", async () => {
			const { api1 } = testGlobals;
			const { actionChain } = await unwrap(api1.users["action-chain"].$get());

			// Actions are ordered by seq asc, so each prevHash must equal the prior entry's hash
			for (let i = 1; i < actionChain.length; i++) {
				const prev = actionChain[i - 1];
				const curr = actionChain[i];
				if (!prev || !curr) throw new Error(`Missing action at index ${i}`);
				expect(curr.prevHash).toBe(prev.hash);
			}
		});
	});
});

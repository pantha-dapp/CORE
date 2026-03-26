import { beforeAll, describe, expect, it } from "bun:test";
import { testGlobals } from "./helpers/globals";
import { userWallet1 } from "./helpers/setup";
import { testCompleteChapter, testCreateCourse } from "./helpers/testHelpers";

describe("Feed Posts", () => {
	let courseId: string;
	let chapterId: string;

	beforeAll(async () => {
		const { api1 } = testGlobals;

		courseId = await testCreateCourse(api1);

		await api1.courses.enroll.$post({ json: { courseId } });

		const chaptersRes = await api1.courses[":id"].chapters.$get({
			param: { id: courseId },
		});
		const chaptersData = await chaptersRes.json();
		if (!chaptersData.success) throw new Error("Failed to fetch chapters");
		const chapter = chaptersData.data.chapters[0];
		if (!chapter?.id) throw new Error("No chapters found");
		chapterId = chapter.id;
	});

	describe("share-chapter-completion", () => {
		it("returns 403 when chapter has not been completed", async () => {
			const { api1 } = testGlobals;
			const res = await api1.users.social.feed[
				"share-chapter-completion"
			].$post({
				json: { chapterId },
			});
			expect(res.status).toBe(403);
		});

		it("returns 404 for a non-existent chapterId", async () => {
			const { api1 } = testGlobals;
			const res = await api1.users.social.feed[
				"share-chapter-completion"
			].$post({
				json: { chapterId: "non-existent-chapter-id" },
			});
			expect(res.status).toBe(404);
		});

		it("can share chapter completion after completing the chapter", async () => {
			const { api1 } = testGlobals;

			await testCompleteChapter(chapterId, api1, userWallet1);

			const res = await api1.users.social.feed[
				"share-chapter-completion"
			].$post({
				json: { chapterId },
			});
			expect(res.status).toBe(201);
			const data = await res.json();
			expect(data.success).toBe(true);
		});

		it("returns 409 when sharing the same chapter completion twice", async () => {
			const { api1 } = testGlobals;
			const res = await api1.users.social.feed[
				"share-chapter-completion"
			].$post({
				json: { chapterId },
			});
			expect(res.status).toBe(409);
		});
	});

	describe("share-streak-extension", () => {
		it("returns 403 when user has no active streak", async () => {
			const { api2 } = testGlobals;
			// api2 has not completed any chapter, so streak should be 0
			const res =
				await api2.users.social.feed["share-streak-extension"].$post();
			expect(res.status).toBe(403);
		});

		it("can share streak extension after gaining a streak", async () => {
			const { api1 } = testGlobals;
			// api1 completed a chapter in beforeAll so has a streak of at least 1
			const res =
				await api1.users.social.feed["share-streak-extension"].$post();
			expect(res.status).toBe(201);
			const data = await res.json();
			expect(data.success).toBe(true);
		});

		it("returns 409 when sharing streak extension more than once today", async () => {
			const { api1 } = testGlobals;
			const res =
				await api1.users.social.feed["share-streak-extension"].$post();
			expect(res.status).toBe(409);
		});
	});
});

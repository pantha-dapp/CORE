import { describe, expect, it, setSystemTime } from "bun:test";
import { jsonStringify } from "@pantha/shared";
import { testGlobals } from "./helpers/globals";
import { userWallet1 } from "./helpers/setup";
import { testCompleteChapter, testCreateCourse } from "./helpers/testHelpers";

let courseId: string;
let firstChapterId: string;
let initialEnrollmentCount = 0;

describe("Courses Generation & Entrollment", () => {
	it("initially user has no enrollments", async () => {
		const { api1 } = testGlobals;
		const enrolledRes = await api1.users[":wallet"].courses.$get({
			param: { wallet: userWallet1.account.address },
		});
		const enrolledData = await enrolledRes.json();
		expect(enrolledRes.status).toBe(200);
		if (!enrolledData.success) {
			throw new Error("Failed to fetch enrolled courses");
		}
		initialEnrollmentCount = enrolledData.data.courses.length;
	});

	it("can generate course", async () => {
		const { api1 } = testGlobals;
		courseId = await testCreateCourse(api1);
		expect(courseId).toBeTruthy();
	});

	it("Chapters are generated after course generation", async () => {
		const { api1 } = testGlobals;
		const res = await api1.courses[":id"].chapters.$get({
			param: { id: courseId },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch chapters");
		}
		expect(data.data.chapters.length).toBeGreaterThan(0);

		const candidateFirstChapterId = data.data.chapters[0]?.id;
		if (!candidateFirstChapterId) {
			throw new Error("No chapters found");
		}
		firstChapterId = candidateFirstChapterId;
	});

	it("Enrolls in generated course", async () => {
		const { api1 } = testGlobals;
		const enrolledRes = await api1.users[":wallet"].courses.$get({
			param: { wallet: userWallet1.account.address },
		});
		const enrolledData = await enrolledRes.json();
		expect(enrolledRes.status).toBe(200);
		if (!enrolledData.success) {
			throw new Error("Failed to fetch enrolled courses");
		}
		expect(enrolledData.data.courses.length).toBe(initialEnrollmentCount + 1);
		expect(enrolledData.data.courses.some((c) => c.courseId === courseId)).toBe(
			true,
		);
	});
});

describe("Chapter & game Sessions", async () => {
	let trackedPage = 0;

	const session = async (api: typeof testGlobals.api1 = testGlobals.api1) => {
		const res = await api.courses.chapters.session.$get({
			query: { chapterId: firstChapterId },
		});
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to create chapter session");
		}
		trackedPage = data.data.currentPage;
		return data.data;
	};

	const pages = async () => {
		const { api1 } = testGlobals;
		const pagesRes = await api1.courses.chapters[":id"].pages.$get({
			param: { id: firstChapterId },
		});
		const pagesData = await pagesRes.json();
		if (!pagesData.success) {
			throw new Error("Failed to fetch chapter pages");
		}
		if (!("pages" in pagesData.data)) {
			throw new Error("Unexpected response: no pages in data");
		}
		const { pages } = pagesData.data;

		return pages;
	};

	async function answer(answerValue: string[]) {
		const { api1 } = testGlobals;

		const currentPages = await pages();
		const pageId = currentPages[trackedPage]?.id as string;

		const hashRes = await api1.users[":wallet"]["action-hash"].$get({
			param: { wallet: userWallet1.account.address },
		});
		const hashData = await hashRes.json();
		if (!hashData.success) throw new Error("Failed to get action hash");
		const prevHash = hashData.data.actionHash;

		const message = jsonStringify({
			prevHash,
			userWallet: userWallet1.account.address,
			label: "page:answer",
			data: { chapterId: firstChapterId, pageId, correct: true },
		});
		const signature = await userWallet1.signMessage({ message });

		const res = await api1.courses.chapters.session.answer.$post({
			json: { answer: answerValue },
			header: { "X-Signature": signature },
		});
		const data = await res.json();
		if (!data.success) {
			throw new Error(`Failed to submit answer: ${data.error}`);
		}
		trackedPage++;
		return data.data;
	}

	let complete = false;

	it("can fetch chapters", async () => {
		const { api1 } = testGlobals;
		const res = await api1.courses[":id"].chapters.$get({
			param: { id: courseId },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch chapter page content");
		}
		expect(data.data.chapters.length).toBeGreaterThan(0);

		const firstChapterIdCandidate = data.data.chapters[0]?.id;
		if (!firstChapterIdCandidate) {
			throw new Error("No chapters found");
		}
		firstChapterId = firstChapterIdCandidate;
	});

	it("can fetch chapter pages", async () => {
		const pagesData = await pages();
		expect(pagesData.length).toBeGreaterThan(0);
	});

	it("can start session", async () => {
		const { api1 } = testGlobals;
		const res = await api1.courses.chapters.session.$get({
			query: { chapterId: firstChapterId },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch chapter session");
		}
		expect(data.data.currentPage).toBe(0);
	});

	it("correct answers are accepted, pages in session move and progress is updated after completion", async () => {
		const { api1 } = testGlobals;

		const initialProgressRaw = await api1.users[":wallet"].courses.$get({
			param: { wallet: userWallet1.account.address },
		});
		const initialProgressData = await initialProgressRaw.json();
		if (!initialProgressData.success) {
			throw new Error("Failed to fetch user courses");
		}
		const initialProgress = initialProgressData.data.courses.find(
			(c) => c.courseId === courseId,
		)?.progress;
		expect(initialProgress).toBe(0);

		complete = await testCompleteChapter(firstChapterId, api1);
		expect(complete).toBe(true);

		const finalProgressRaw = await api1.users[":wallet"].courses.$get({
			param: { wallet: userWallet1.account.address },
		});
		const finalProgressData = await finalProgressRaw.json();
		if (!finalProgressData.success) {
			throw new Error("Failed to fetch user courses");
		}
		const finalProgress = finalProgressData.data.courses.find(
			(c) => c.courseId === courseId,
		)?.progress;
		expect(finalProgress).toBe(1);
	});

	it("rejects answers when no seesion", async () => {
		expect(async () => await answer(["incorrect answer"])).toThrow();
	});

	it("terminates session on delete endpoint", async () => {
		const { api1 } = testGlobals;
		await api1.courses.chapters.session.$delete();
		expect(async () => await answer(["incorrect answer"])).toThrow();
	});

	it("progresses but rejects incorrect answers", async () => {
		const { api1 } = testGlobals;
		await api1.courses.chapters.session.$delete(); //terminate existing session
		const { currentPage: pageBefore } = await session();
		await answer([""]);
		const resp = await answer(["incorrect answer"]);
		expect(resp.correct).toBe(false);
		const { currentPage: pageAfter } = await session();
		expect(pageAfter).toBe(pageBefore + 2);
	});

	it("session expires and is deleted after expiry duration", async () => {
		const { api1 } = testGlobals;
		await api1.courses.chapters.session.$delete(); //terminate existing session
		await session(); // start new session
		await answer([""]);
		const { currentPage: pageBefore } = await session();
		expect(pageBefore).toBe(1);

		setSystemTime(Date.now() + 31 * 60 * 1000); // move time forward by 31 minutes

		expect(async () => await answer([""])).toThrow();
		const { currentPage: pageAfter } = await session();
		expect(pageAfter).toBe(0);

		setSystemTime();
	});
});

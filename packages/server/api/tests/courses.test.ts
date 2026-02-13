import { describe, expect, it } from "bun:test";
import { jsonStringify } from "@pantha/shared";
import { testGlobals } from "./helpers/globals";
import { testChapterGenerationPages } from "./helpers/testAiAdapter";

async function awaitJob(jobId: string) {
	return new Promise<{ state: string; error?: string }>((resolve, reject) => {
		const interval = setInterval(async () => {
			const { api1 } = testGlobals;
			const res = await api1.jobs[":id"].$get({ param: { id: jobId } });
			const data = await res.json();
			if (!data.success) {
				clearInterval(interval);
				reject(new Error("Failed to fetch job status"));
				return;
			}
			if (data.data.state === "success") {
				clearInterval(interval);
				resolve({ state: "success" });
			} else if (data.data.state === "failed") {
				clearInterval(interval);
				resolve({ state: "failed", error: data.data.error });
			}
		}, 1000);
	});
}

let courseId: string;
let firstChapterId: string;

describe("Courses Generation & Entrollment", () => {
	it("initially user has no enrollments", async () => {
		const { api1 } = testGlobals;
		const enrolledRes = await api1.courses.enrolled.$get();
		const enrolledData = await enrolledRes.json();
		expect(enrolledRes.status).toBe(200);
		if (!enrolledData.success) {
			throw new Error("Failed to fetch enrolled courses");
		}
		expect(enrolledData.data.enrollments).toEqual([]);
	});

	const session = async (api: typeof testGlobals.api1 = testGlobals.api1) => {
		const res = await api.courses.gen.session.$get();
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to create course generation session");
		}
		return data.data.session;
	};

	const action = async (
		api: typeof testGlobals.api1,
		action: Parameters<
			(typeof testGlobals.api1)["courses"]["gen"]["action"]["$post"]
		>[0]["json"],
	) => {
		const res = await api.courses.gen.action.$post({ json: action });
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to perform course generation action");
		}
		return data.data;
	};

	it("can generate course", async () => {
		const { api1 } = testGlobals;
		expect((await session()).state).toBe("major_category_choice");
		await action(api1, {
			type: "major_category_choice",
			category: 0,
		});
		expect((await session()).state).toBe("learning_intent_freetext");
		const { jobId } = await action(api1, {
			type: "learning_intent_freetext",
			intent: "I want to learn for fun",
		});
		jobId && (await awaitJob(jobId));
		expect((await session()).state).toBe("answer_question");
		const { questions } = await session();
		await Promise.all(
			questions.map(
				(q) =>
					new Promise<void>((resolve) => {
						action(api1, {
							type: "answer_question",
							questionKey: q.key,
							answer: "yes",
						}).then(async (res) => {
							res.jobId && (await awaitJob(res.jobId));
							resolve();
						});
					}),
			),
		);
		const finishedSession = await session();
		expect(finishedSession.state).toBe("finished");
		courseId = finishedSession.courseId ?? "";
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
		const enrolledRes = await api1.courses.enrolled.$get();
		const enrolledData = await enrolledRes.json();
		expect(enrolledRes.status).toBe(200);
		if (!enrolledData.success) {
			throw new Error("Failed to fetch enrolled courses");
		}
		expect(enrolledData.data.enrollments.length).toBe(1);

		courseId = enrolledData.data.enrollments[0]?.courseId ?? "";
	});
});

describe("Chapter Info", async () => {
	const session = async (api: typeof testGlobals.api1 = testGlobals.api1) => {
		const res = await api.courses.chapters.session.$get({
			query: { chapterId: firstChapterId },
		});
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to create chapter session");
		}
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
		const { pages } = pagesData.data;

		return pages;
	};

	async function currentPage() {
		const { currentPage } = await session();
		const page = (await pages())[currentPage];

		return page?.content;
	}

	async function answer(answer: string[]) {
		const { api1 } = testGlobals;
		const res = await api1.courses.chapters.session.answer.$post({
			json: { answer },
		});
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to submit answer");
		}
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

	it("correct answers are accepted and session progresses", async () => {
		let tries = 0;
		while (!complete) {
			tries++;
			if (tries > 100) {
				throw new Error(
					"Too many tries, something might be wrong with the test",
				);
			}

			const page = await currentPage();
			const matchingPage = findMatchingPage(testChapterGenerationPages, page);

			if (page?.type === "example_uses") {
				const resp = await answer([""]);
				expect(resp.correct).toBe(true);
				complete = resp.complete;
			}

			if (page?.type === "quiz") {
				const resp = await answer([
					matchingPage?.content.correctOptionIndex?.toString() ?? "",
				]);
				expect(resp.correct).toBe(true);
				complete = resp.complete;
			}

			if (page?.type === "teach_and_explain_content") {
				const resp = await answer([""]);
				expect(resp.correct).toBe(true);
				complete = resp.complete;
			}

			if (page?.type === "true_false") {
				const resp = await answer([
					matchingPage?.content.isTrue?.toString() ?? "",
				]);
				expect(resp.correct).toBe(true);
				complete = resp.complete;
			}

			if (page?.type === "identify_shown_object_in_image") {
				const resp = await answer([
					matchingPage?.content.correctOptionIndex?.toString() ?? "",
				]);
				expect(resp.correct).toBe(true);
				complete = resp.complete;
			}

			if (page?.type === "matching") {
				const resp = await answer([
					JSON.stringify(
						shuffleArray(matchingPage.content.pairs ?? []),
						null,
						2,
					),
				]);
				expect(resp.correct).toBe(true);
				complete = resp.complete;
			}

			if (page?.type === "identify_object_from_images") {
				const resp = await answer([
					matchingPage?.content.correctImageIndex?.toString() ?? "",
				]);
				expect(resp.correct).toBe(true);
				complete = resp.complete;
			}
		}
	});
});

// biome-ignore lint/suspicious/noExplicitAny: its just a test>
function findMatchingPage(_pages: any[], _page: any) {
	const pages = JSON.parse(JSON.stringify(_pages));
	const page = JSON.parse(JSON.stringify(_page));
	let res: number = -1;
	// @ts-expect-error
	pages.forEach((p, i) => {
		p.content.correctOptionIndex = null;
		page.content.correctOptionIndex = null;
		p.content.isTrue = null;
		page.content.isTrue = null;
		p.content.correctImageIndex = null;
		page.content.correctImageIndex = null;
		p.content.pairs = [];
		page.content.pairs = [];

		if (jsonStringify(p) === jsonStringify(page)) {
			res = i;
		}
	});

	return _pages[res] as (typeof testChapterGenerationPages)[number];
}

function shuffleArray<T>(array: T[]): T[] {
	const newArray: T[] = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		// biome-ignore lint/style/noNonNullAssertion: we know these indexes exist
		[newArray[i]!, newArray[j]!] = [newArray[j]!, newArray[i]!];
	}
	return newArray;
}

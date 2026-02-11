import { describe, expect, it } from "bun:test";
import { testGlobals } from "./helpers/globals";

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
		expect((await session()).state).toBe("finished");
	});

	// it("course generation hits cache", async () => {
	// 	const { api2 } = testGlobals;

	// 	expect((await session(api2)).state).toBe("major_category_choice");
	// 	await action(api2, {
	// 		type: "major_category_choice",
	// 		category: 0,
	// 	});
	// 	expect((await session(api2)).state).toBe("learning_intent_freetext");
	// 	const { jobId } = await action(api2, {
	// 		type: "learning_intent_freetext",
	// 		intent: "I want to learn for fun",
	// 	});
	// 	jobId && (await awaitJob(jobId));
	// 	expect((await session(api2)).state).toBe("answer_question");
	// 	const { questions } = await session(api2);
	// 	await Promise.all(
	// 		questions.map(
	// 			(q) =>
	// 				new Promise<void>((resolve) => {
	// 					action(api2, {
	// 						type: "answer_question",
	// 						questionKey: q.key,
	// 						answer: "yes",
	// 					}).then(async (res) => {
	// 						res.jobId && (await awaitJob(res.jobId));
	// 						resolve();
	// 					});
	// 				}),
	// 		),
	// 	);
	// 	expect((await session(api2)).state).toBe("finished");
	// });

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

describe("Chapter Info", () => {
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
		const { api1 } = testGlobals;
		const res = await api1.courses.chapters[":id"].pages.$get({
			param: { id: firstChapterId },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch chapter page content");
		}
		expect(data.data.pages.length).toBeGreaterThan(0);
	});
});

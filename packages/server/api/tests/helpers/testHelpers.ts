import { jsonStringify } from "@pantha/shared";
import { testGlobals } from "./globals";
import { userWallet1, userWallet2 } from "./setup";
import { testChapterGenerationPages } from "./testAiAdapter";

/**
 * Makes userWallet1 and userWallet2 friends by having them follow each other
 */
export async function testBecomeFriends(
	api1 = testGlobals.api1,
	api2 = testGlobals.api2,
) {
	const postRes = await api1.users.follow.$post({
		json: {
			walletToFollow: userWallet2.account.address,
		},
	});
	const data = await postRes.json();
	if (postRes.status !== 200 || !data.success) {
		throw new Error("Failed to make users become friends (api1 follow api2)");
	}

	const postRes2 = await api2.users.follow.$post({
		json: {
			walletToFollow: userWallet1.account.address,
		},
	});
	const data2 = await postRes2.json();
	if (postRes2.status !== 200 || !data2.success) {
		throw new Error("Failed to make users become friends (api2 follow api1)");
	}
}

export async function testCreateCourse(
	api1 = testGlobals.api1,
): Promise<string> {
	// Delete any existing gen session so we start fresh
	await api1.courses.gen.session.$delete();

	const getSession = async () => {
		const res = await api1.courses.gen.session.$get();
		const data = await res.json();

		if (!data.success) {
			throw new Error("Failed to create course generation session");
		}
		return data.data.session;
	};

	// Helper to perform action in course generation
	const performAction = async (
		action: Parameters<
			(typeof testGlobals.api1)["courses"]["gen"]["action"]["$post"]
		>[0]["json"],
	) => {
		const res = await api1.courses.gen.action.$post({ json: action });
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to perform course generation action");
		}
		return data.data;
	};

	// Helper to await job completion
	const awaitJob = async (jobId: string): Promise<void> => {
		return new Promise<void>((resolve, reject) => {
			let isResolved = false;
			const timeout = setTimeout(() => {
				if (!isResolved) {
					isResolved = true;
					reject(new Error(`Job ${jobId} timed out after 60 seconds`));
				}
			}, 60000); // 60 second timeout

			const interval = setInterval(async () => {
				if (isResolved) return;
				try {
					const res = await api1.jobs[":id"].$get({ param: { id: jobId } });
					const data = await res.json();
					if (!data.success) {
						clearInterval(interval);
						clearTimeout(timeout);
						isResolved = true;
						reject(new Error("Failed to fetch job status"));
						return;
					}
					if (data.data.state === "success") {
						clearInterval(interval);
						clearTimeout(timeout);
						isResolved = true;
						resolve();
					} else if (data.data.state === "failed") {
						clearInterval(interval);
						clearTimeout(timeout);
						isResolved = true;
						reject(new Error(`Job failed: ${data.data.error}`));
					}
				} catch (error) {
					clearInterval(interval);
					clearTimeout(timeout);
					isResolved = true;
					reject(error);
				}
			}, 1000);
		});
	};

	// Create a fresh session
	await getSession();

	await performAction({
		type: "major_category_choice",
		category: 0,
	});

	const { jobId } = await performAction({
		type: "learning_intent_freetext",
		intent: "I want to learn for fun",
	});
	jobId && (await awaitJob(jobId));

	const { questions } = await getSession();
	await Promise.all(
		questions.map(
			(q) =>
				new Promise<void>((resolve) => {
					performAction({
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

	const finishedSession = await getSession();
	const courseId = finishedSession.courseId ?? "";

	// Wait for all background event handlers (e.g. prepareChapter) to finish
	// before returning, so tests see a fully-prepared chapter.
	const bus = testGlobals.appState.eventBus as { drain?: () => Promise<void> };
	if (typeof bus.drain === "function") {
		await bus.drain();
	}

	return courseId;
}

/**
 * Completes a chapter by answering all pages correctly
 * Returns true when chapter is complete
 */
export async function testCompleteChapter(
	chapterId: string,
	api1 = testGlobals.api1,
	wallet: typeof userWallet1 = userWallet1,
): Promise<boolean> {
	const getSession = async () => {
		const res = await api1.courses.chapters.session.$get({
			query: { chapterId },
		});
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to create chapter session");
		}
		return data.data;
	};

	// biome-ignore lint/suspicious/noExplicitAny: its just a test
	const getPages = async (): Promise<any[]> => {
		const res = await api1.courses.chapters[":id"].pages.$get({
			param: { id: chapterId },
		});
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to fetch chapter pages");
		}

		if ("pages" in data.data) {
			return data.data.pages;
		}
		throw new Error("Unexpected response: no pages in data");
	};

	// Returns { content, pageId } for the current page
	const getCurrentPage = async (): Promise<{
		// biome-ignore lint/suspicious/noExplicitAny: its just a test
		content: any;
		pageId: string;
	}> => {
		const { currentPage } = await getSession();
		const pagesData = await getPages();
		const page = pagesData[currentPage];
		return { content: page?.content, pageId: page?.id as string };
	};

	const submitAnswer = async (answer: string[], pageId: string) => {
		const hashRes = await api1.users[":wallet"]["action-hash"].$get({
			param: { wallet: wallet.account.address },
		});
		const hashData = await hashRes.json();
		if (!hashData.success) throw new Error("Failed to get action hash");
		const prevHash = hashData.data.actionHash;

		const message = jsonStringify({
			prevHash,
			userWallet: wallet.account.address,
			label: "page:answer",
			data: { chapterId, pageId, correct: true },
		});
		const signature = await wallet.signMessage({ message });

		const res = await api1.courses.chapters.session.answer.$post({
			json: { answer },
			header: { "X-Signature": signature },
		});
		const data = await res.json();
		if (!data.success) {
			throw new Error("Failed to submit answer");
		}
		return data.data;
	};

	// biome-ignore lint/suspicious/noExplicitAny: its just a test
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

		return _pages[res];
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

	// Complete the chapter by answering all pages
	let complete = false;
	let tries = 0;

	while (!complete) {
		tries++;
		if (tries > 100) {
			throw new Error(
				"Too many tries completing chapter, something might be wrong",
			);
		}

		const { content: page, pageId } = await getCurrentPage();
		const matchingPage = findMatchingPage(testChapterGenerationPages, page);

		let resp: Awaited<ReturnType<typeof submitAnswer>>;

		if (page?.type === "example_uses") {
			resp = await submitAnswer([""], pageId);
		} else if (page?.type === "quiz") {
			resp = await submitAnswer(
				[matchingPage?.content.correctOptionIndex?.toString() ?? ""],
				pageId,
			);
		} else if (page?.type === "teach_and_explain_content") {
			resp = await submitAnswer([""], pageId);
		} else if (page?.type === "true_false") {
			resp = await submitAnswer(
				[matchingPage?.content.isTrue?.toString() ?? ""],
				pageId,
			);
		} else if (page?.type === "identify_shown_object_in_image") {
			resp = await submitAnswer(
				[matchingPage?.content.correctOptionIndex?.toString() ?? ""],
				pageId,
			);
		} else if (page?.type === "matching") {
			resp = await submitAnswer(
				[
					JSON.stringify(
						shuffleArray(matchingPage.content.pairs ?? []),
						null,
						2,
					),
				],
				pageId,
			);
		} else if (page?.type === "identify_object_from_images") {
			resp = await submitAnswer(
				[matchingPage?.content.correctImageIndex?.toString() ?? ""],
				pageId,
			);
		} else {
			throw new Error(`Unknown page type: ${page?.type}`);
		}

		if (!resp.correct) {
			throw new Error("Answer was not correct");
		}
		complete = resp.complete;
	}

	return complete;
}

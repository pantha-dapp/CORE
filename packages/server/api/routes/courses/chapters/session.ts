import { jsonParse, jsonStringify } from "@pantha/shared";
import { MINUTE } from "@pantha/shared/constants";
import { zHex } from "@pantha/shared/zod";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { config } from "../../../../config";
import type { DbSchema } from "../../../../lib/db/schema";
import { NotFoundError, ValidationError } from "../../../../lib/errors";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import type { RouterEnv } from "../../types";

type ChapterGameState = {
	chapterId: string;
	pages: Array<DbSchema["chapterPages"]["$inferSelect"]>;
	currentPage: number;
	correct: number[];
	incorrect: number[];
	answers: Record<number, string[]>;
	lastSessionStartedAt: number;
};
const gameSessions = new Map<string, ChapterGameState>();

const SESSION_TIMEOUT = 30 * MINUTE;

function checkSessionExpiry(userWallet: string) {
	const session = gameSessions.get(userWallet);
	if (!session) return false;
	const now = Date.now();
	const expired = now - session.lastSessionStartedAt > SESSION_TIMEOUT;
	if (expired) gameSessions.delete(userWallet);
	return expired;
}

export default new Hono<RouterEnv>()

	.get(
		"/",
		authenticated,
		validator(
			"query",
			z.object({
				chapterId: z.string().min(1),
			}),
		),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { chapterId } = ctx.req.valid("query");
			let session = gameSessions.get(userWallet);

			if (session?.chapterId !== chapterId) {
				gameSessions.delete(userWallet);
			}

			session = gameSessions.get(userWallet);

			if (!session) {
				const chapterPages = await db.chapterPagesById({ chapterId });

				if (!chapterPages || chapterPages.length === 0) {
					throw new NotFoundError("Chapter not found");
				}
				gameSessions.set(userWallet, {
					chapterId,
					pages: chapterPages,
					currentPage: 0,
					correct: [],
					incorrect: [],
					answers: {},
					lastSessionStartedAt: Date.now(),
				});
				session = gameSessions.get(userWallet);
			}

			if (!session) {
				return respond.err(ctx, "Failed to create session", 500);
			}

			const expired = checkSessionExpiry(userWallet);
			if (expired) throw new NotFoundError("Session expired");

			return respond.ok(
				ctx,
				{
					chapterId: session.chapterId,
					currentPage: session.currentPage,
					complete: session.currentPage >= session.pages.length,
				},
				"Session state retrieved successfully.",
				200,
			);
		},
	)

	.delete("/", authenticated, async (ctx) => {
		const { userWallet } = ctx.var;
		gameSessions.delete(userWallet);
		return respond.ok(ctx, {}, "Session reset successfully.", 200);
	})

	.get("/explanation", authenticated, async (ctx) => {
		const { userWallet } = ctx.var;
		const { ai } = ctx.var.appState;
		const session = gameSessions.get(userWallet);

		if (!session) {
			throw new NotFoundError(
				"No active session found. Please start a session.",
			);
		}

		const lastAnsweredPageIndex =
			session.correct.length + session.incorrect.length - 1;
		if (lastAnsweredPageIndex < 0) {
			throw new NotFoundError(
				"No questions answered yet. Please answer a question to get an explanation.",
			);
		}

		const lastAnsweredPage = session.pages[lastAnsweredPageIndex];
		if (!lastAnsweredPage) {
			return respond.err(ctx, "Last answered page not found", 500);
		}

		const explanation = await ai.llm.generateAnswerExplanation({
			question: lastAnsweredPage.content,
			userGivenAnswer:
				session.answers[lastAnsweredPageIndex]?.join(", ") ??
				"user did not provide an answer",
			correct: session.correct.includes(lastAnsweredPageIndex),
		});

		return respond.ok(
			ctx,
			{
				explanation,
			},
			"Answer explanation retrieved successfully.",
			200,
		);
	})

	.post(
		"/answer",
		authenticated,
		validator(
			"json",
			z.object({
				answer: z.string().array().min(1),
			}),
		),
		validator(
			"header",
			z.object({
				"X-Signature": zHex(),
			}),
		),
		async (ctx) => {
			const { eventBus, db } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { "X-Signature": signature } = ctx.req.valid("header");
			const { answer } = ctx.req.valid("json");

			const expired = checkSessionExpiry(userWallet);
			if (expired) throw new NotFoundError("Session expired");

			const session = gameSessions.get(userWallet);
			if (!session) {
				throw new NotFoundError(
					"No active session found. Please start a session.",
				);
			}
			if (session.currentPage >= session.pages.length) {
				throw new ValidationError(
					"Session is already complete. No more answers can be submitted.",
				);
			}
			if (answer[0] === undefined) {
				throw new ValidationError("Answer cannot be empty");
			}

			const page = session.pages[session.currentPage];
			if (!page) {
				throw new NotFoundError("No more pages in the session");
			}

			const { content, type } = page.content;

			let correct = false;
			let skipLogging = false;
			try {
				switch (type) {
					case "example_uses":
						correct = true;
						skipLogging = true;
						break;
					case "fill_in_the_blanks": {
						const hasPlaceholders = (content.words as string[]).some((w) =>
							/\$\d+/.test(w),
						);
						correct = hasPlaceholders
							? jsonStringify(content.answers) === jsonStringify(answer)
							: true;
						break;
					}
					case "identify_object_from_images":
						correct = content.correctImageIndex === parseInt(answer[0], 10);
						break;
					case "identify_shown_object_in_image":
						correct = content.correctOptionIndex === parseInt(answer[0], 10);
						break;
					case "matching": {
						// Use spread copies so we never mutate the stored page data
						const parsedAnswer = z.array(z.any()).parse(jsonParse(answer[0]));
						correct =
							jsonStringify(
								[...content.pairs].sort((a, b) =>
									jsonStringify(a) < jsonStringify(b) ? -1 : 1,
								),
							) ===
							jsonStringify(
								[...parsedAnswer].sort((a, b) =>
									jsonStringify(a) < jsonStringify(b) ? -1 : 1,
								),
							);
						break;
					}
					case "quiz":
						correct = content.correctOptionIndex === parseInt(answer[0], 10);
						break;
					case "true_false":
						correct = content.isTrue === (answer[0].toLowerCase() === "true");
						break;
					case "teach_and_explain_content":
						correct = true;
						skipLogging = true;
						break;
					default:
						break;
				}
				session.answers[session.currentPage] = answer;
			} catch {
				correct = false;
			}

			session.currentPage += 1;

			gameSessions.set(userWallet, session);

			if (!skipLogging) {
				session[correct ? "correct" : "incorrect"].push(session.currentPage);

				await db.insert(db.schema.userAnswerLogs).values({
					pageId: page.id,
					correct: correct,
				});

				db.registerAction({
					userWallet,
					label: "page:answer",
					data: {
						chapterId: session.chapterId,
						pageId: page.id,
						correct,
					},
					signature,
				}).catch((err) => {
					gameSessions.delete(userWallet);
					console.error("Failed to log user action:", err);
				});
			}

			if (session.currentPage >= session.pages.length) {
				gameSessions.delete(userWallet);

				const { db } = ctx.var.appState;
				const chapter = await db.chapterById({ chapterId: session.chapterId });
				if (!chapter) {
					return respond.err(ctx, "Chapter not found", 404);
				}

				const [userCourse] = await db
					.select()
					.from(db.schema.userCourses)
					.where(
						and(
							eq(db.schema.userCourses.userWallet, userWallet),
							eq(db.schema.userCourses.courseId, chapter.courseId),
						),
					);

				const isFirstCompletion =
					!userCourse || userCourse.progress <= chapter.order;

				eventBus.emit(
					isFirstCompletion ? "chapter.completed" : "chapter.revised",
					{
						chapterId: session.chapterId,
						walletAddress: userWallet,
						correct: session.correct.length,
					},
				);

				const xpBase = isFirstCompletion
					? config.xpMintedForChapterCompletion
					: config.xpMintedForChapterRevision;
				const xpGained =
					Math.floor(xpBase / 2) +
					Math.floor(
						(xpBase * (session.correct.length / session.pages.length)) / 2,
					);

				return respond.ok(
					ctx,
					{
						complete: true,
						correct,
						report: {
							correct: session.correct.length,
							total: session.pages.length,
							xp: xpGained,
						},
					},
					"Session completed.",
					200,
				);
			}

			return respond.ok(
				ctx,
				{
					complete: false,
					correct,
					currentPage: session.currentPage,
				},
				"Answer processed successfully.",
				200,
			);
		},
	);

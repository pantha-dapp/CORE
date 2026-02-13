import { jsonParse, jsonStringify } from "@pantha/shared";
import { MINUTE } from "@pantha/shared/constants";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import type { Schema } from "../../../../lib/db/schema";
import { prepareChapter } from "../../../../lib/utils/chapters";
import { respond } from "../../../../lib/utils/respond";
import { registerActivityForStreaks } from "../../../../lib/utils/streaks";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import type { RouterEnv } from "../../types";

type ChapterGameState = {
	chapterId: string;
	pages: Array<Schema["chapterPages"]["$inferSelect"]>;
	currentPage: number;
	correct: number[];
	incorrect: number[];
	lastSessionStartedAt: number;
};
const gameSessions = new Map<string, ChapterGameState>();

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
			const { userWallet, db } = ctx.var;
			const { chapterId } = ctx.req.valid("query");
			let session = gameSessions.get(userWallet);

			if (session?.chapterId !== chapterId) {
				gameSessions.delete(userWallet);
			}

			session = gameSessions.get(userWallet);

			if (!session) {
				const chapterPages = await db.chapterPagesById({ chapterId });

				if (!chapterPages || chapterPages.length === 0) {
					return respond.err(ctx, "Chapter not found", 404);
				}
				gameSessions.set(userWallet, {
					chapterId,
					pages: chapterPages,
					currentPage: 0,
					correct: [],
					incorrect: [],
					lastSessionStartedAt: Date.now(),
				});
				session = gameSessions.get(userWallet);
			}

			if (!session) {
				return respond.err(ctx, "Failed to create session", 500);
			}

			const { lastSessionStartedAt } = session;
			if (lastSessionStartedAt + 10 * MINUTE > Date.now()) {
				return respond.ok(
					ctx,
					{
						chapterId: session.chapterId,
						currentPage: session.currentPage,
					},
					"Session state retrieved successfully.",
					200,
				);
			} else {
				gameSessions.delete(userWallet);
				return respond.err(ctx, "Session expired", 410);
			}
		},
	)

	.post(
		"/answer",
		authenticated,
		validator(
			"json",
			z.object({
				answer: z.string().array().min(1),
			}),
		),
		async (ctx) => {
			const { userWallet, db, ai } = ctx.var;
			const { answer } = ctx.req.valid("json");

			const session = gameSessions.get(userWallet);
			if (!session) {
				return respond.err(
					ctx,
					"No active session found. Please start a session.",
					404,
				);
			}
			if (answer[0] === undefined) {
				return respond.err(ctx, "Answer cannot be empty", 400);
			}

			const page = session.pages[session.currentPage];
			if (!page) {
				return respond.err(ctx, "No more pages in the session", 400);
			}

			const { content, type } = page.content;

			let correct = false;

			switch (type) {
				case "example_uses":
					correct = true;
					break;
				case "fill_in_the_blanks":
					correct = jsonStringify(content.answers) === jsonStringify(answer);
					break;
				case "identify_object_from_images":
					correct = content.correctImageIndex === parseInt(answer[0], 10);
					break;
				case "identify_shown_object_in_image":
					correct = content.correctOptionIndex === parseInt(answer[0], 10);
					break;
				case "matching":
					correct =
						jsonStringify(content.pairs) ===
						jsonStringify(jsonParse(answer[0]));
					break;
				case "quiz":
					correct = content.correctOptionIndex === parseInt(answer[0], 10);
					break;
				case "true_false":
					correct = content.isTrue === (answer[0].toLowerCase() === "true");
					break;
				case "teach_and_explain_content":
					correct = true;
					break;
				default:
					break;
			}

			if (correct) {
				session.correct.push(session.currentPage);
			} else {
				session.incorrect.push(session.currentPage);
			}
			session.currentPage += 1;
			session.lastSessionStartedAt = Date.now();

			gameSessions.set(userWallet, session);

			if (session.currentPage >= session.pages.length) {
				gameSessions.delete(userWallet);
				const currentChapter = await db.chapterById({
					chapterId: session.chapterId,
				});
				if (!currentChapter) {
					throw new Error("Unreachable code: Chapter not found");
				}

				const [nextChapter] = await db
					.select()
					.from(db.schema.courseChapters)
					.where(
						and(
							eq(db.schema.courseChapters.courseId, currentChapter.courseId),
							eq(db.schema.courseChapters.order, currentChapter.order + 1),
						),
					);
				if (nextChapter) prepareChapter(nextChapter.id, { db, ai });
				registerActivityForStreaks(db, userWallet);

				return respond.ok(
					ctx,
					{
						complete: true,
						correct,
						report: {
							correct: session.correct.length,
							total: session.pages.length,
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

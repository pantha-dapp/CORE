import { jsonStringify } from "@pantha/shared";
import { MINUTE } from "@pantha/shared/constants";
import { Hono } from "hono";
import z from "zod";
import db from "../../../../lib/db";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";

type ChapterGameState = {
	chapterId: string;
	pages: Array<typeof db.schema.chapterPages.$inferSelect>;
	currentPage: number;
	correct: number[];
	incorrect: number[];
	lastSessionStartedAt: number;
};
const gameSessions = new Map<string, ChapterGameState>();

export default new Hono()

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
			const { userWallet } = ctx.var;
			const { answer } = ctx.req.valid("json");

			const session = gameSessions.get(userWallet);
			if (!session) {
				return respond.err(
					ctx,
					"No active session found. Please start a session.",
					404,
				);
			}
			if (!answer[0]) {
				return respond.err(ctx, "Answer cannot be empty", 400);
			}

			const page = session.pages[session.currentPage];
			if (!page) {
				return respond.err(ctx, "No more pages in the session", 400);
			}

			const { content, type } = page.content;

			let correct = false;

			switch (type) {
				case "example_usages":
					correct = true;
					break;
				case "fill_in_the_blanks":
					correct = content.missingWordIndices.every((index: number) => {
						return (
							content.sentance.split(" ")[
								content.missingWordIndices[index] ?? -1
							] === answer[index]
						);
					});
					break;
				case "identify_object_from_images":
					correct = content.correctImageIndex === parseInt(answer[0], 10);
					break;
				case "identify_shown_object_in_image":
					correct = content.correctOptionIndex === parseInt(answer[0], 10);
					break;
				case "matching":
					correct = jsonStringify(content.pairs) === jsonStringify(answer);
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

			return respond.ok(
				ctx,
				{
					correct,
					currentPage: session.currentPage,
				},
				"Answer processed successfully.",
				200,
			);
		},
	);

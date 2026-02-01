import { jsonStringify } from "@pantha/shared";
import { Hono } from "hono";
import z from "zod";
import { categories } from "../../../../data/categories";
import db from "../../../../lib/db";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";

type ChapterGameState = {
	chapterId: string;
	pages: Array<typeof db.schema.chapterPages.$inferSelect>;
	currentPage: number;
	correct: [];
	incorrect: [];
	lastSessionStartedAt: number;
};
const gameSessions = new Map<string, ChapterGameState>();

export default new Hono()

	.post(
		"/",
		authenticated,
		validator(
			"json",
			z.object({
				chapterId: z.string().min(1),
			}),
		),
		async (ctx) => {
			const { userWallet } = ctx.var;
			const { chapterId } = ctx.req.valid("json");

			if (gameSessions.has(userWallet)) {
				gameSessions.delete(userWallet);
			}
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

			return respond.ok(ctx, {}, "Session started successfully.", 201);
		},
	)

	.get("/", authenticated, async (ctx) => {
		const { userWallet } = ctx.var;
		const session = gameSessions.get(userWallet);

		if (!session) {
			return respond.err(
				ctx,
				"No active session found. Please start a session.",
				404,
			);
		}

		const { lastSessionStartedAt } = session;
		if (lastSessionStartedAt + 60_000 > Date.now()) {
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
		},
	);

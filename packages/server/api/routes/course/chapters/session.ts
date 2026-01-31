import { tryCatch } from "@pantha/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { categories } from "../../../../data/categories";
import { generateEmbeddings } from "../../../../lib/ai/engine";
import {
	clarificationQuestionGenerator,
	courseSelectionEvaluator,
	generateCanonicalCourseDescriptor,
	generateIdealCourseDescriptor,
	generateNewCourseSkeleton,
	intentClarification,
} from "../../../../lib/ai/tasks";
import type db from "../../../../lib/db";
import { createVectorDbClient } from "../../../../lib/db/vec/client";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import { createJob } from "../../jobs";

const DEFAULT_QUESTIONS_BUDGET = 20;
const vectorDb = createVectorDbClient("course-embeddings");

type ChapterGameState = {
	chapterId: string;
	pages: Array<typeof db.schema.chapterPages.$inferSelect>;
	correct: [];
	incorrect: [];
	lastSessionStartedAt: number;
};
const gameSessions = new Map<string, ChapterGameState>();

export default new Hono()

	.get("/session", authenticated, async (ctx) => {
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
					session,
				},
				"Session state retrieved successfully.",
				200,
			);
		} else {
			gameSessions.delete(userWallet);
			return respond.err(ctx, "Session expired", 410);
		}
	})

	.get("/categories", authenticated, async (ctx) => {
		return respond.ok(
			ctx,
			{ categories },
			"Categories fetched successfully.",
			200,
		);
	});

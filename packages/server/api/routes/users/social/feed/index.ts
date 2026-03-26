import { and, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { NotFoundError } from "../../../../../lib/errors";
import { respond } from "../../../../../lib/utils/respond";
import { authenticated } from "../../../../middleware/auth";
import { validator } from "../../../../middleware/validator";
import type { RouterEnv } from "../../../types";

export default new Hono<RouterEnv>()
	.post("/share-streak-extension", authenticated, async (ctx) => {
		const { db } = ctx.var.appState;
		const { userWallet } = ctx.var;

		const [userStreak] = await db
			.select()
			.from(db.schema.userStreaks)
			.where(eq(db.schema.userStreaks.userId, userWallet));

		if (!userStreak || userStreak.currentStreak < 1) {
			return respond.err(ctx, "No active streak", 403);
		}

		const todayStart = new Date();
		todayStart.setUTCHours(0, 0, 0, 0);

		const [existingStreakPost] = await db
			.select({ id: db.schema.feedpost.id })
			.from(db.schema.feedpost)
			.where(
				and(
					eq(db.schema.feedpost.userWallet, userWallet),
					sql`json_extract(${db.schema.feedpost.payload}, '$.type') = 'streak-extension'`,
					gte(db.schema.feedpost.createdAt, todayStart),
				),
			);

		if (existingStreakPost) {
			return respond.err(ctx, "Already shared your streak today", 409);
		}

		await db.insert(db.schema.feedpost).values({
			userWallet,
			payload: {
				type: "streak-extension",
				newStreak: userStreak.currentStreak,
			},
		});

		return respond.ok(ctx, {}, "Shared to feed.", 201);
	})

	.post(
		"/share-chapter-completion",
		authenticated,
		validator(
			"json",
			z.object({
				chapterId: z.string().min(1),
			}),
		),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { chapterId } = ctx.req.valid("json");

			const chapter = await db.chapterById({ chapterId });
			if (!chapter) throw new NotFoundError("Chapter not found");

			const [userCourse] = await db
				.select()
				.from(db.schema.userCourses)
				.where(
					and(
						eq(db.schema.userCourses.userWallet, userWallet),
						eq(db.schema.userCourses.courseId, chapter.courseId),
					),
				);

			if (!userCourse || userCourse.progress <= chapter.order) {
				return respond.err(ctx, "Chapter not completed", 403);
			}

			const [existingChapterPost] = await db
				.select({ id: db.schema.feedpost.id })
				.from(db.schema.feedpost)
				.where(
					and(
						eq(db.schema.feedpost.userWallet, userWallet),
						sql`json_extract(${db.schema.feedpost.payload}, '$.type') = 'chapter-completion'`,
						sql`json_extract(${db.schema.feedpost.payload}, '$.chapterId') = ${chapterId}`,
					),
				);

			if (existingChapterPost) {
				return respond.err(ctx, "Already shared this chapter completion", 409);
			}

			await db.insert(db.schema.feedpost).values({
				userWallet,
				payload: { type: "chapter-completion", chapterId },
			});

			return respond.ok(ctx, {}, "Shared to feed.", 201);
		},
	);

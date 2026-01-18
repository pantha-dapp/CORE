import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import db from "../../../lib/db";
import dbClient from "../../../lib/db/client";
import {
	chapterTopics,
	courseChapters,
	courses,
	courseTopics,
} from "../../../lib/db/schema/course";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";
import gen from "./gen";

export default new Hono()

	.route("/gen", gen)

	.get(
		"/",
		authenticated,
		validator(
			"query",
			z.object({
				limit: z.coerce.number().min(1).max(100).optional().default(20),
				offset: z.coerce.number().min(0).optional().default(0),
			}),
		),
		async (ctx) => {
			const { limit, offset } = ctx.req.valid("query");

			const coursesList = await dbClient
				.select()
				.from(courses)
				// .where()
				.limit(limit)
				.offset(offset)
				.orderBy(sql`${courses.createdAt} DESC`);

			const coursesWithTopics = await Promise.all(
				coursesList.map(async (course) => {
					const topics = await dbClient
						.select()
						.from(courseTopics)
						.where(eq(courseTopics.courseId, course.id));

					return {
						...course,
						topics: topics.map((t) => t.topic),
					};
				}),
			);

			return respond.ok(
				ctx,
				{
					courses: coursesWithTopics,
					pagination: {
						limit,
						offset,
						count: coursesWithTopics.length,
					},
				},
				"Courses fetched successfully.",
				200,
			);
		},
	)

	.get("/:id", authenticated, async (ctx) => {
		const courseId = ctx.req.param("id");

		const [course] = await dbClient
			.select()
			.from(courses)
			.where(eq(courses.id, courseId));

		if (!course) {
			return respond.err(ctx, "Course not found.", 404);
		}

		if (course.deletedAt) {
			return respond.err(ctx, "Course has been deleted.", 410);
		}

		const topics = await dbClient
			.select()
			.from(courseTopics)
			.where(eq(courseTopics.courseId, courseId));

		const chapters = await dbClient
			.select()
			.from(courseChapters)
			.where(eq(courseChapters.courseId, courseId))
			.orderBy(courseChapters.order);

		const chaptersWithTopics = await Promise.all(
			chapters.map(async (chapter) => {
				const chapterTopicsList = await dbClient
					.select()
					.from(chapterTopics)
					.where(eq(chapterTopics.chapterId, chapter.id));

				return {
					...chapter,
					topics: chapterTopicsList.map((t) => t.topic),
				};
			}),
		);

		return respond.ok(
			ctx,
			{
				...course,
				topics: topics.map((t) => t.topic),
				chapters: chaptersWithTopics,
			},
			"Course fetched successfully.",
			200,
		);
	})

	.post(
		"/enroll",
		authenticated,
		validator(
			"json",
			z.object({
				courseId: z.string().uuid(),
			}),
		),
		async (ctx) => {
			const userWallet = ctx.get("userWallet");
			const { courseId } = ctx.req.valid("json");

			const [existingEnrollment] = await db
				.select()
				.from(db.schema.userCourses)
				.where(
					and(
						eq(db.schema.userCourses.userWallet, userWallet),
						eq(db.schema.userCourses.courseId, courseId),
					),
				);

			if (existingEnrollment) {
				return respond.err(ctx, "Already enrolled in the course.", 409);
			}

			await db
				.insert(db.schema.userCourses)
				.values({
					userWallet: userWallet,
					courseId: courseId,
				})
				.onConflictDoNothing()
				.execute();
		},
	);

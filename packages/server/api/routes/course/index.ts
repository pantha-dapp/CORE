import { tryCatch } from "@pantha/shared";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import db from "../../../lib/db";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";
import chapters from "./chapters";
import gen from "./gen";

export default new Hono()

	.route("/gen", gen)

	.route("/chapters", chapters)

	.get("/enrolled", authenticated, async (ctx) => {
		const userWallet = ctx.get("userWallet");
		const enrollments = await db.userEnrollments({ userWallet });

		return respond.ok(
			ctx,
			{ enrollments },
			"Enrollments fetched successfully.",
			200,
		);
	})

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

			const coursesList = await db
				.select()
				.from(db.schema.courses)
				// .where()
				.limit(limit)
				.offset(offset)
				.orderBy(sql`${db.schema.courses.createdAt} DESC`);

			const coursesWithTopics = await Promise.all(
				coursesList.map(async (course) => {
					const topics = await db
						.select()
						.from(db.schema.courseTopics)
						.where(eq(db.schema.courseTopics.courseId, course.id));

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

			const enrollmentResult = await tryCatch(
				db.enrollUserInCourse({
					userWallet: userWallet,
					courseId,
				}),
			);

			if (enrollmentResult.error) {
				return respond.err(
					ctx,
					`Failed to enroll in course. ${enrollmentResult.error.message}`,
					500,
				);
			}

			return respond.ok(
				ctx,
				{ enrollment: enrollmentResult.data },
				"Enrolled in course successfully.",
				201,
			);
		},
	)

	.get("/:id", authenticated, async (ctx) => {
		const courseId = ctx.req.param("id");

		const course = await db.courseById({ courseId });
		if (!course) {
			return respond.err(ctx, "Course not found.", 404);
		}

		return respond.ok(
			ctx,
			{
				id: course.id,
				title: course.title,
				description: course.description,
			},
			"Course fetched successfully.",
			200,
		);
	})

	.get("/:id", authenticated, async (ctx) => {
		const courseId = ctx.req.param("id");

		const course = await db.courseById({ courseId });
		if (!course) {
			return respond.err(ctx, "Course not found.", 404);
		}

		return respond.ok(
			ctx,
			{
				id: course.id,
				title: course.title,
				description: course.description,
			},
			"Course fetched successfully.",
			200,
		);
	})

	.get("/:id/chapters", authenticated, async (ctx) => {
		const courseId = ctx.req.param("id");
		const chapters = await db.courseChaptersById({ courseId });
		return respond.ok(ctx, { chapters }, "Chapters fetched successfully.", 200);
	});

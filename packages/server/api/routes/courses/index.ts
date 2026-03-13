import { tryCatch } from "@pantha/shared";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { prepareCourseIcons } from "../../../lib/utils/courses";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";
import chapters from "./chapters";
import gen from "./gen";

export default new Hono()

	.route("/chapters", chapters)

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
			const { db } = ctx.var.appState;
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
			const { db } = ctx.var.appState;
			const { userWallet } = ctx.var;
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

	.get("/:id/chapters", authenticated, async (ctx) => {
		const { db, ai } = ctx.var.appState;

		const courseId = ctx.req.param("id");
		const chapters = await db.courseChaptersById({ courseId });

		const icons: Record<string, string> = {};
		await Promise.race([
			Promise.all(
				chapters.map(async (chapter) => {
					try {
						const { url } = await ai.image.generateIconImage({
							prompt: chapter.icon.prompt,
						});
						icons[chapter.id] = url;
					} catch {
						/* skip failed icons */
					}
				}),
			),
			Bun.sleep(5000),
		]);

		return respond.ok(
			ctx,
			{ chapters, icons },
			"Chapters fetched successfully.",
			200,
		);
	})

	.get("/:id", authenticated, async (ctx) => {
		const { db, ai } = ctx.var.appState;
		const courseId = ctx.req.param("id");

		prepareCourseIcons(courseId, { db, ai });

		const course = await db.courseById({ courseId });
		if (!course) {
			return respond.err(ctx, "Course not found.", 404);
		}

		const iconResult = await Promise.race([
			ai.image.generateIconImage({ prompt: course.icon.prompt }),
			Bun.sleep(5000).then(() => null),
		]);

		return respond.ok(
			ctx,
			{
				id: course.id,
				title: course.title,
				description: course.description,
				icon: iconResult?.url ?? null,
			},
			"Course fetched successfully.",
			200,
		);
	});

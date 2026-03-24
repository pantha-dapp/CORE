import { tryCatch } from "@pantha/shared";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { UMAP } from "umap-js";
import z from "zod";
import { generateCanonicalCourseDescriptor } from "../../../lib/ai/tasks/utils";
import { createVectorDb } from "../../../lib/db/vec/client";
import {
	prepareCourseChapters,
	prepareCourseIcons,
} from "../../../lib/utils/courses";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";
import chapters from "./chapters";
import gen from "./gen";

export default new Hono()

	.route("/chapters", chapters)

	.route("/gen", gen)

	.get("/explore", authenticated, async (ctx) => {
		const N = 5;
		const MAX = 50;

		const { db, ai } = ctx.var.appState;
		const { userWallet } = ctx.var;

		const enrolledCourses = await db.userEnrollments({ userWallet });

		if (!enrolledCourses || enrolledCourses.length === 0) {
			return respond.err(ctx, "User is not enrolled in any courses.", 404);
		}

		const coursesVectorDb = createVectorDb(db.vector, "course-embeddings");

		const seenIds = new Set<string>();
		const courses: { id: string; vector: number[] }[] = [];

		for (const enrollment of enrolledCourses) {
			if (courses.length >= MAX) break;

			const course = await db.courseById({
				courseId: enrollment.courseId,
			});
			if (!course) continue;

			const canonicalDescriptor = generateCanonicalCourseDescriptor({
				name: course.title,
				description: course.description,
				topics: course.topics,
			});
			const courseEmbedding = await ai.embedding.text(canonicalDescriptor);

			if (!seenIds.has(enrollment.courseId)) {
				seenIds.add(enrollment.courseId);
				courses.push({ id: enrollment.courseId, vector: courseEmbedding });
			}

			if (courses.length >= MAX) break;

			const similarCourses = await coursesVectorDb.querySimilar(
				courseEmbedding,
				N,
			);
			for (const c of similarCourses) {
				if (courses.length >= MAX) break;
				if (seenIds.has(c.payload.courseId)) continue;
				seenIds.add(c.payload.courseId);
				courses.push({ id: c.payload.courseId, vector: c.vector ?? [] });
			}
		}

		const suggestions = await db
			.select()
			.from(db.schema.courses)
			.orderBy(sql`RANDOM()`)
			.limit(N);

		const cachedPoints = await Promise.all(
			courses.map((c) => db.redis.get(`umap:course:${c.id}`)),
		);

		const allCached = cachedPoints.every((p) => p !== null);

		let coursesWithPoints: { id: string; point: { x: number; y: number } }[];

		if (allCached) {
			coursesWithPoints = courses.map((c, i) => {
				const point = JSON.parse(cachedPoints[i] as string);
				return { id: c.id, point };
			});
		} else {
			const vectors = courses.map((c) => {
				const norm = Math.sqrt(c.vector.reduce((sum, x) => sum + x * x, 0));
				return c.vector.map((x) => x / norm + (Math.random() - 0.5) * 1e-10);
			});

			let points2D: number[][] = vectors.map(() => [0, 0]);
			if (vectors.length >= 2) {
				const umap = new UMAP({
					nNeighbors: Math.min(5, vectors.length - 1),
					minDist: 0.1,
					nComponents: 2,
				});
				points2D = umap.fit(vectors);
			}

			coursesWithPoints = courses.map((c, i) => ({
				id: c.id,
				point: { x: points2D[i]?.[0] ?? 0, y: points2D[i]?.[1] ?? 0 },
			}));

			await Promise.all(
				coursesWithPoints.map((c) =>
					db.redis.setex(`umap:course:${c.id}`, 3600, JSON.stringify(c.point)),
				),
			);
		}

		return respond.ok(
			ctx,
			{
				courses: coursesWithPoints,
				suggestions,
			},
			"Similar courses fetched successfully.",
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

		if (courseId && chapters.length === 0) {
			prepareCourseChapters(ctx.req.param("id"), { db, ai });
			return respond.err(
				ctx,
				"Course chapters are being prepared. Please check back later.",
				503,
			);
		}

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

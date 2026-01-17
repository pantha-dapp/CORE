import { Hono } from "hono";
import { eq, isNull, sql } from "drizzle-orm";
import z from "zod";
import dbClient from "../../../lib/db/client";
import {
	chapterTopics,
	courseChapters,
	courseTopics,
	courses,
} from "../../../lib/db/schema/course";
import { generateEmbeddings } from "../../../lib/ai/engine";
import { generateCanonicalCourseDescriptor } from "../../../lib/ai/tasks/courses";
import { createVectorDbClient } from "../../../lib/db/vec/client";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";

const vectorDb = createVectorDbClient("course-embeddings");

export default new Hono()

	.post(
		"/",
		authenticated,
		validator(
			"json",
			z.object({
				title: z.string().min(3).max(200),
				description: z.string().min(10).max(2000),
				topics: z.array(z.string()).min(1).max(50),
			}),
		),
		async (ctx) => {
			const { title, description, topics } = ctx.req.valid("json");

			const courseId = crypto.randomUUID();

			await dbClient.insert(courses).values({
				id: courseId,
				title,
				description,
			});

			if (topics.length > 0) {
				await dbClient.insert(courseTopics).values(
					topics.map((topic) => ({
						id: crypto.randomUUID(),
						courseId,
						topic,
					})),
				);
			}

			const canonicalDescriptor = generateCanonicalCourseDescriptor({
				name: title,
				description,
				topics,
			});
			const embedding = await generateEmbeddings(canonicalDescriptor);
			vectorDb.writeEntry(courseId, embedding);

			return respond.ok(
				ctx,
				{
					id: courseId,
					title,
					description,
					topics,
				},
				"Course created successfully.",
				201,
			);
		},
	)

	.get(
		"/",
		authenticated,
		validator(
			"query",
			z.object({
				limit: z.coerce.number().min(1).max(100).optional().default(20),
				offset: z.coerce.number().min(0).optional().default(0),
				includeDeleted: z.coerce.boolean().optional().default(false),
			}),
		),
		async (ctx) => {
			const { limit, offset, includeDeleted } = ctx.req.valid("query");

			const whereClause = includeDeleted
				? undefined
				: isNull(courses.deletedAt);

			const coursesList = await dbClient
				.select()
				.from(courses)
				.where(whereClause)
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

	.patch(
		"/:id",
		authenticated,
		validator(
			"json",
			z.object({
				title: z.string().min(3).max(200).optional(),
				description: z.string().min(10).max(2000).optional(),
				topics: z.array(z.string()).min(1).max(50).optional(),
			}),
		),
		async (ctx) => {
			const courseId = ctx.req.param("id");
			const updates = ctx.req.valid("json");

			const [existingCourse] = await dbClient
				.select()
				.from(courses)
				.where(eq(courses.id, courseId));

			if (!existingCourse) {
				return respond.err(ctx, "Course not found.", 404);
			}

			if (existingCourse.deletedAt) {
				return respond.err(ctx, "Cannot update a deleted course.", 410);
			}

			if (updates.title || updates.description) {
				await dbClient
					.update(courses)
					.set({
						...(updates.title && { title: updates.title }),
						...(updates.description && { description: updates.description }),
						updatedAt: new Date(),
					})
					.where(eq(courses.id, courseId));
			}

			if (updates.topics) {
				await dbClient
					.delete(courseTopics)
					.where(eq(courseTopics.courseId, courseId));

				await dbClient.insert(courseTopics).values(
					updates.topics.map((topic) => ({
						id: crypto.randomUUID(),
						courseId,
						topic,
					})),
				);
			}

			const [updatedCourse] = await dbClient
				.select()
				.from(courses)
				.where(eq(courses.id, courseId));

			if (!updatedCourse) {
				return respond.err(ctx, "Course not found after update.", 500);
			}

			const topics = await dbClient
				.select()
				.from(courseTopics)
				.where(eq(courseTopics.courseId, courseId));

			if (updates.title || updates.description || updates.topics) {
				const canonicalDescriptor = generateCanonicalCourseDescriptor({
					name: updatedCourse.title,
					description: updatedCourse.description,
					topics: topics.map((t) => t.topic),
				});
				const embedding = await generateEmbeddings(canonicalDescriptor);
				vectorDb.writeEntry(courseId, embedding);
			}

			return respond.ok(
				ctx,
				{
					...updatedCourse,
					topics: topics.map((t) => t.topic),
				},
				"Course updated successfully.",
				200,
			);
		},
	)

	.delete("/:id", authenticated, async (ctx) => {
		const courseId = ctx.req.param("id");

		const [course] = await dbClient
			.select()
			.from(courses)
			.where(eq(courses.id, courseId));

		if (!course) {
			return respond.err(ctx, "Course not found.", 404);
		}

		if (course.deletedAt) {
			return respond.err(ctx, "Course is already deleted.", 410);
		}

		await dbClient
			.update(courses)
			.set({ deletedAt: new Date() })
			.where(eq(courses.id, courseId));

		vectorDb.deleteEntry(courseId);

		return respond.ok(
			ctx,
			{ id: courseId },
			"Course deleted successfully.",
			200,
		);
	})

	.post("/:id/restore", authenticated, async (ctx) => {
		const courseId = ctx.req.param("id");

		const [course] = await dbClient
			.select()
			.from(courses)
			.where(eq(courses.id, courseId));

		if (!course) {
			return respond.err(ctx, "Course not found.", 404);
		}

		if (!course.deletedAt) {
			return respond.err(ctx, "Course is not deleted.", 400);
		}

		await dbClient
			.update(courses)
			.set({ deletedAt: null })
			.where(eq(courses.id, courseId));

		const topics = await dbClient
			.select()
			.from(courseTopics)
			.where(eq(courseTopics.courseId, courseId));

		const canonicalDescriptor = generateCanonicalCourseDescriptor({
			name: course.title,
			description: course.description,
			topics: topics.map((t) => t.topic),
		});
		const embedding = await generateEmbeddings(canonicalDescriptor);
		vectorDb.writeEntry(courseId, embedding);

		return respond.ok(
			ctx,
			{
				...course,
				deletedAt: null,
				topics: topics.map((t) => t.topic),
			},
			"Course restored successfully.",
			200,
		);
	});

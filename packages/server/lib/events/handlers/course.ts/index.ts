import { eq } from "drizzle-orm";
import type { AppState } from "../../../../api/routes/types";
import { categories } from "../../../../data/categories";
import { generateCanonicalCourseDescriptor } from "../../../ai/tasks/utils";
import { cosineSimilarity } from "../../../db/vec/client";
import { prepareChapter } from "../../../utils/chapters";
import { prepareCourseIcons } from "../../../utils/courses";
import { prepareSimilarCourses } from "../../../utils/similarCourses";

export default function (appState: AppState) {
	const { eventBus: event, db, ai } = appState;

	event.on("course.generate", async ({ courseId }) => {
		try {
			const course = await db.courseById({ courseId });
			if (!course) return;

			const [firstChapter, secondChapter] = await db
				.select({ id: db.schema.courseChapters.id })
				.from(db.schema.courseChapters)
				.where(eq(db.schema.courseChapters.courseId, courseId))
				.orderBy(db.schema.courseChapters.order)
				.limit(2);

			if (!firstChapter || !secondChapter) return;

			await Promise.all([
				prepareCourseIcons(courseId, { db, ai }),
				prepareChapter(firstChapter.id, { db, ai }),
				prepareChapter(secondChapter.id, { db, ai }),
				prepareSimilarCourses(courseId, { db, ai }),
			]);
		} catch (err) {
			console.error(
				`Failed to prepare course ${courseId} after generation:`,
				err,
			);
		}
	});

	event.on("course.generate", async ({ courseId }) => {
		const categoriesWithEmbeddings = await Promise.all(
			categories.map(async (category) => ({
				name: category,
				embedding: await ai.embedding.text(category),
			})),
		);
		const course = await db.courseById({ courseId });
		if (!course) return;

		const courseEmbedding = await ai.embedding.text(
			generateCanonicalCourseDescriptor({
				name: course.title,
				description: course.description,
				topics: course.topics,
			}),
		);

		const bestCategory = categoriesWithEmbeddings.reduce(
			(best, cat) => {
				const score = cosineSimilarity(courseEmbedding, cat.embedding);
				return score > best.score ? { name: cat.name, score } : best;
			},
			{ name: categories[0] ?? "Other", score: -Infinity },
		);

		const [inserted] = await db
			.insert(db.schema.learningGroupChats)
			.values({
				category: bestCategory.name,
			})
			.onConflictDoNothing()
			.returning();

		const categoryGroup =
			inserted ??
			(await db.query.learningGroupChats.findFirst({
				where: eq(db.schema.learningGroupChats.category, bestCategory.name),
			}));

		if (!categoryGroup) return;

		await db.insert(db.schema.learningGroupCourses).values({
			courseId: courseId,
			learningGroupChatId: categoryGroup.id,
		});
	});
}

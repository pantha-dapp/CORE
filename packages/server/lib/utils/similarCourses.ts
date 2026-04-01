import { eq } from "drizzle-orm";
import type { Ai } from "../ai";
import type { Db } from "../db";
import { NotFoundError } from "../errors";
import { insertCourseIntoVectorDb, prepareCourseIcons } from "./courses";

const preparing = new Set<string>();

export async function prepareSimilarCourses(
	id: string,
	config: { db: Db; ai: Ai },
) {
	const { db, ai } = config;

	const course = await db.courseById({ courseId: id });
	if (!course) {
		throw new NotFoundError("Course not found.");
	}

	if (preparing.has(id)) {
		return;
	}
	preparing.add(id);

	const { similarCourses } = await ai.llm.generateSimilarCourses({
		coursesCount: 5,
		targetCourse: {
			description: course.description,
			title: course.title,
			topics: course.topics,
		},
	});

	for (const generatedCourse of similarCourses) {
		let createdCourseInfo:
			| {
					id: string;
					title: string;
					description: string;
					topics: string[];
			  }
			| undefined;

		await db.transaction(async (tx) => {
			const existingCourseWithTitle = tx
				.select()
				.from(db.schema.courses)
				.where(eq(db.schema.courses.title, generatedCourse.title))
				.get();
			if (existingCourseWithTitle) {
				return;
			}

			const [createdCourse] = await tx
				.insert(db.schema.courses)
				.values({
					title: generatedCourse.title,
					description: generatedCourse.description,
					icon: { prompt: generatedCourse.icon, url: null },
				})
				.returning();
			if (!createdCourse) {
				return;
			}
			for (const topic of generatedCourse.topics) {
				await tx.insert(db.schema.courseTopics).values({
					courseId: createdCourse.id,
					topic,
				});
			}
			createdCourseInfo = {
				id: createdCourse.id,
				title: createdCourse.title,
				description: createdCourse.description,
				topics: generatedCourse.topics,
			};
		});

		if (createdCourseInfo) {
			insertCourseIntoVectorDb(
				createdCourseInfo.id,
				{
					title: createdCourseInfo.title,
					description: createdCourseInfo.description,
					topics: createdCourseInfo.topics,
				},
				{ db, ai },
			).catch(console.error);
			prepareCourseIcons(createdCourseInfo.id, { db, ai }).catch(console.error);
		}
	}
}

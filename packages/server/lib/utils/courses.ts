import { and, eq } from "drizzle-orm";
import type { Ai } from "../ai";
import type { Db } from "../db";
import { NotFoundError } from "../errors";

const preparing = new Set<string>();

export async function prepareCourseIcons(
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

	const courseIconUrl = course.icon.url;
	if (!courseIconUrl) {
		ai.image
			.generateIconImage({ prompt: course.icon.prompt })
			.then((icon) =>
				db
					.update(db.schema.courses)
					.set({
						icon: { prompt: course.icon.prompt, url: icon.url },
					})
					.where(eq(db.schema.courses.id, course.id)),
			)
			.catch(console.error);
	}

	const chapters = await db.courseChaptersById({ courseId: id });

	for (const [idx, chapter] of chapters.entries()) {
		!chapter.icon.url &&
			ai.image
				.generateIconImage({ prompt: chapter.icon.prompt })
				.then((icon) =>
					db
						.update(db.schema.courseChapters)
						.set({ icon: { prompt: chapter.icon.prompt, url: icon.url } })
						.where(
							and(
								eq(db.schema.courseChapters.courseId, course.id),
								eq(db.schema.courseChapters.order, idx),
							),
						),
				)
				.catch(console.error);
	}
}

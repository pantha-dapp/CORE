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
		ai.image.generateIconImage({ prompt: course.icon.prompt });
	}

	const chapters = await db.courseChaptersById({ courseId: id });

	for (const [_, chapter] of chapters.entries()) {
		!chapter.icon.url &&
			ai.image
				.generateIconImage({ prompt: chapter.icon.prompt })
				.catch(console.error);
	}
}

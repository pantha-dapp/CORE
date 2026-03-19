import type { Ai } from "../ai";
import type { Db } from "../db";
import { NotFoundError } from "../errors";

const preparingIcon = new Set<string>();
export async function prepareCourseIcons(
	id: string,
	config: { db: Db; ai: Ai },
) {
	const { db, ai } = config;

	const course = await db.courseById({ courseId: id });
	if (!course) {
		throw new NotFoundError("Course not found.");
	}

	if (preparingIcon.has(id)) {
		return;
	}
	preparingIcon.add(id);

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

const preparingChapters = new Set<string>();
export async function prepareCourseChapters(
	id: string,
	config: { db: Db; ai: Ai },
) {
	const { db, ai } = config;

	const course = await db.courseById({ courseId: id });
	if (!course) {
		throw new NotFoundError("Course not found.");
	}

	if (preparingChapters.has(id)) {
		return;
	}
	preparingChapters.add(id);

	const { overview } = await ai.llm.generateNewCourseSkeleton({
		courseTitle: course.title,
		courseDescription: course.description,
		assumedPrerequisites: [...course.topics],
		targetAudience: "Generic learner interested in the course topic",
		constraints: {
			focus: "theoretical and practical balance, no follow along tutorials.",
			granularity: "very fine-grained",
			minimumChapters: 50,
		},
	});

	await db
		.insert(db.schema.courseChapters)
		.values(
			overview.chapters.map((chapter, idx) => ({
				courseId: course.id,
				title: chapter.title,
				description: chapter.description,
				intent: chapter.intent,
				order: idx,
				icon: { prompt: chapter.icon, url: null },
			})),
		)
		.execute();
	prepareCourseIcons(id, config).catch(console.error);
}

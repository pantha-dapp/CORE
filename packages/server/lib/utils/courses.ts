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
	console.log("[prepareCourseIcons] Starting icon preparation", {
		courseId: id,
	});

	const course = await db.courseById({ courseId: id });
	if (!course) {
		console.error("[prepareCourseIcons] Course not found", { courseId: id });
		throw new NotFoundError("Course not found.");
	}

	if (preparing.has(id)) {
		console.log("[prepareCourseIcons] Course is already being prepared", {
			courseId: id,
		});
		return;
	}
	preparing.add(id);

	const courseIconUrl = course.icon.url;
	if (!courseIconUrl) {
		console.log("[prepareCourseIcons] Generating course icon", {
			courseId: course.id,
			prompt: course.icon.prompt,
		});
		ai.image
			.generateIconImage({ prompt: course.icon.prompt })
			.then((icon) => {
				console.log("[prepareCourseIcons] Course icon generated", {
					courseId: course.id,
					iconUrl: icon.url,
				});

				return db
					.update(db.schema.courses)
					.set({
						icon: { prompt: course.icon.prompt, url: icon.url },
					})
					.where(eq(db.schema.courses.id, course.id));
			})
			.catch((error) => {
				console.error("[prepareCourseIcons] Failed to generate course icon", {
					courseId: course.id,
					error,
				});
			});
	}

	const chapters = await db.courseChaptersById({ courseId: id });
	console.log("[prepareCourseIcons] Loaded chapters", {
		courseId: id,
		chapterCount: chapters.length,
	});

	for (const [idx, chapter] of chapters.entries()) {
		if (chapter.icon.url) {
			continue;
		}

		console.log("[prepareCourseIcons] Generating chapter icon", {
			courseId: course.id,
			chapterOrder: idx,
			prompt: chapter.icon.prompt,
		});

		ai.image
			.generateIconImage({ prompt: chapter.icon.prompt })
			.then((icon) => {
				console.log("[prepareCourseIcons] Chapter icon generated", {
					courseId: course.id,
					chapterOrder: idx,
					iconUrl: icon.url,
				});

				return db
					.update(db.schema.courseChapters)
					.set({ icon: { prompt: chapter.icon.prompt, url: icon.url } })
					.where(
						and(
							eq(db.schema.courseChapters.courseId, course.id),
							eq(db.schema.courseChapters.order, idx),
						),
					);
			})
			.catch((error: unknown) => {
				console.error("[prepareCourseIcons] Failed to generate chapter icon", {
					courseId: course.id,
					chapterOrder: idx,
					error,
				});
			});
	}

	console.log("[prepareCourseIcons] Scheduled icon generation tasks", {
		courseId: id,
	});
}

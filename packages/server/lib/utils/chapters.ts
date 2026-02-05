import { and, eq, lte } from "drizzle-orm";
import { generateChapterPages } from "../ai/tasks";
import db from "../db";

const preparing = new Set<string>();

export async function prepareChapter(id: string) {
	const chapter = await db.chapterById({ chapterId: id });
	if (!chapter) {
		throw new Error("Chapter not found.");
	}

	const pages = await db.chapterPagesById({ chapterId: id });
	if (pages && pages.length > 0) {
		return;
	}

	if (preparing.has(id)) {
		return;
	}

	const chaptersTillNow = await db
		.select()
		.from(db.schema.courseChapters)
		.where(
			and(
				eq(db.schema.courseChapters.courseId, chapter.courseId),
				lte(db.schema.courseChapters.order, chapter.order),
			),
		)
		.orderBy(db.schema.courseChapters.order);

	const chaptersTillNowWithTopics = await Promise.all(
		chaptersTillNow.map(async (ch) => {
			const topics = await db
				.select()
				.from(db.schema.chapterTopics)
				.where(eq(db.schema.chapterTopics.chapterId, ch.id));

			return {
				...ch,
				topics: topics.map((t) => t.topic),
			};
		}),
	);

	const { pages: generatedPages } = await generateChapterPages({
		chapter: {
			overview: {
				title: chapter.title,
				description: chapter.description,
				intent: chapter.intent,
				topics: chapter.topics,
			},
		},
		courseTillNowOverview: chaptersTillNowWithTopics.map((ch) => ({
			title: ch.title,
			description: ch.description,
			intent: ch.intent,
			topics: ch.topics,
		})),
		minimumPages: 10 + Math.ceil(chaptersTillNow.length / 15),
	});

	await db.transaction(async (tx) => {
		const inserted = [];
		for (let i = 0; i < generatedPages.length; i++) {
			const page = generatedPages[i];

			if (!page) continue;

			const [insertedPage] = await tx
				.insert(db.schema.chapterPages)
				.values({
					chapterId: id,
					order: i + 1,
					content: page,
				})
				.returning();
			inserted.push(insertedPage);
		}
	});

	preparing.delete(id);

	// we will also queue chapter prepataion for images etc for now we dont do that becuse no images are there
}

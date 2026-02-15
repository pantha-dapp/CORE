import { and, eq, gt } from "drizzle-orm";
import type { AppState } from "../../../../api/routes/types";
import { prepareChapter } from "../../../utils/chapters";
import { registerActivityForStreaks } from "../../../utils/streaks";

export default function (appState: AppState) {
	const { eventBus: event, db, ai } = appState;

	event.on("chapter.completed", async ({ walletAddress }) => {
		registerActivityForStreaks(db, walletAddress);
	});

	event.on("chapter.completed", async ({ chapterId }) => {
		// prepare the nex two chapters in the course
		const chapter = await db.chapterById({ chapterId });
		if (!chapter) return;
		const [nextChapter, followingChapter] = await db
			.select({ id: db.schema.courseChapters.id })
			.from(db.schema.courseChapters)
			.where(
				and(
					eq(db.schema.courseChapters.courseId, chapter.courseId),
					gt(db.schema.courseChapters.order, chapter.order),
				),
			)
			.limit(2);
		if (nextChapter) prepareChapter(nextChapter.id, { db, ai });
		if (followingChapter) prepareChapter(followingChapter.id, { db, ai });
	});
}

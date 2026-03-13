import { and, eq, gt } from "drizzle-orm";
import type { AppState } from "../../../../api/routes/types";
import { config } from "../../../../config";
import { userCourses } from "../../../db/schema/user";
import { prepareChapter } from "../../../utils/chapters";
import { registerActivityForStreaks } from "../../../utils/streaks";
import { mintXpForChapter } from "../../../utils/xp";

export default function (appState: AppState) {
	const { eventBus: event, db, ai } = appState;

	event.on("chapter.completed", async ({ walletAddress }) => {
		registerActivityForStreaks(db, walletAddress);
	});

	event.on("chapter.completed", async ({ chapterId, walletAddress }) => {
		const chapter = await db.chapterById({ chapterId });
		if (!chapter) return;
		const [userCourse] = await db
			.select()
			.from(userCourses)
			.where(
				and(
					eq(userCourses.userWallet, walletAddress),
					eq(userCourses.courseId, chapter.courseId),
				),
			);
		if (!userCourse) return;

		if (userCourse.progress < chapter.order + 1) {
			await db
				.update(db.schema.userCourses)
				.set({ progress: chapter.order + 1 })
				.where(
					and(
						eq(db.schema.userCourses.userWallet, walletAddress),
						eq(db.schema.userCourses.courseId, chapter.courseId),
					),
				);
		}
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

	event.on(
		"chapter.completed",
		async ({ walletAddress, chapterId, correct }) => {
			const chapterPages = await db.chapterPagesById({ chapterId });
			if (!chapterPages) return;

			const xpBase = config.xpMintedForChapterCompletion;
			const xpGained =
				Math.floor(xpBase / 2) +
				Math.floor(
					(xpBase * (correct ?? chapterPages.length / chapterPages.length)) / 2,
				);

			await mintXpForChapter({
				walletAddress,
				chapterId,
				xpAmount: xpGained,
				contractsEventName: "CHPTCMPL",
				appState,
			});
		},
	);

	event.on("chapter.revised", async ({ walletAddress, chapterId, correct }) => {
		const chapterPages = await db.chapterPagesById({ chapterId });
		if (!chapterPages) return;

		const xpBase = config.xpMintedForChapterRevision;
		const xpGained =
			Math.floor(xpBase / 2) +
			Math.floor(
				(xpBase * (correct ?? chapterPages.length / chapterPages.length)) / 2,
			);

		await mintXpForChapter({
			walletAddress,
			chapterId,
			xpAmount: xpGained,
			contractsEventName: "CHPTREVS",
			appState,
		});
	});
}

import { bytes8, identifierB8 } from "@pantha/contracts";
import { and, eq, gt } from "drizzle-orm";
import type { AppState } from "../../../../api/routes/types";
import { userCourses } from "../../../db/schema/user";
import { prepareChapter } from "../../../utils/chapters";
import { registerActivityForStreaks } from "../../../utils/streaks";

export default function (appState: AppState) {
	const { eventBus: event, db, ai, contracts } = appState;

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

	event.on("chapter.completed", async ({ walletAddress, chapterId }) => {
		const user = await db.userByWallet({ userWallet: walletAddress });
		if (!user) return;

		const hash = await contracts.PanthaOrchestrator.write.mintXp([
			user.walletAddress,
			BigInt(10),
			bytes8("CHPTCMPL"),
			identifierB8(chapterId),
		]);

		const [xpLog] = await db
			.insert(db.schema.userXpLog)
			.values({
				userWallet: walletAddress,
				xpGained: 10,
				transactionHash: hash,
			})
			.returning();
		if (!xpLog) return;

		contracts.$publicClient
			.waitForTransactionReceipt({ hash })
			.then((receipt) => {
				if (receipt.status === "success") {
					db.update(db.schema.userXpLog)
						.set({ success: true })
						.where(eq(db.schema.userXpLog.id, xpLog.id));
				} else {
					db.delete(db.schema.userXpLog).where(
						eq(db.schema.userXpLog.id, xpLog.id),
					);
				}
			})
			.catch(() => {
				db.delete(db.schema.userXpLog).where(
					eq(db.schema.userXpLog.id, xpLog.id),
				);
			});
	});
}

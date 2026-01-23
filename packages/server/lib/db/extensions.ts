// import type { Address } from "viem";
import { eq } from "drizzle-orm";
import type { Address } from "viem";
import db from ".";
import type dbClient from "./client";

type DbClient = typeof dbClient;

export function dbExtensionHelpers(_db: DbClient) {
	async function userEnrollments(args: { userWallet: Address }) {
		const { userWallet } = args;

		const enrollments = await db
			.select()
			.from(db.schema.userCourses)
			.where(eq(db.schema.userCourses.userWallet, userWallet))
			.orderBy(db.schema.userCourses.createdAt);

		return enrollments;
	}

	async function courseById(args: { courseId: string }) {
		const { courseId } = args;

		const [course] = await db
			.select()
			.from(db.schema.courses)
			.where(eq(db.schema.courses.id, courseId));

		if (!course || course.deletedAt) {
			return null;
		}

		const topics = await db
			.select()
			.from(db.schema.courseTopics)
			.where(eq(db.schema.courseTopics.courseId, courseId));

		return {
			...course,
			topics,
		};
	}

	async function chapterById(args: { chapterId: string }) {
		const { chapterId } = args;

		const [chapter] = await db
			.select()
			.from(db.schema.courseChapters)
			.where(eq(db.schema.courseChapters.id, chapterId));

		if (!chapter) {
			return null;
		}

		const [course] = await db
			.select()
			.from(db.schema.courses)
			.where(eq(db.schema.courses.id, chapter.courseId));

		if (!course || course.deletedAt) {
			return null;
		}

		const chapterTopicsList = await db
			.select()
			.from(db.schema.chapterTopics)
			.where(eq(db.schema.chapterTopics.chapterId, chapter.id));

		return {
			...chapter,
			topics: chapterTopicsList.map((t) => t.topic),
		};
	}

	return { userEnrollments, chapterById, courseById };
}

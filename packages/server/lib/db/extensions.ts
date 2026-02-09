// import type { Address } from "viem";
import { and, eq } from "drizzle-orm";
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

	async function enrollUserInCourse(args: {
		userWallet: Address;
		courseId: string;
	}) {
		const { userWallet, courseId } = args;

		const course = await courseById({ courseId });
		if (!course) {
			throw "Course does not exist.";
		}

		const [existingEnrollment] = await db
			.select()
			.from(db.schema.userCourses)
			.where(
				and(
					eq(db.schema.userCourses.userWallet, userWallet),
					eq(db.schema.userCourses.courseId, course.id),
				),
			);

		if (existingEnrollment) {
			throw "User is already enrolled in the given course.";
		}

		const [enrollment] = await db
			.insert(db.schema.userCourses)
			.values({
				userWallet: userWallet,
				courseId: courseId,
			})
			.onConflictDoNothing()
			.returning()
			.execute();

		return enrollment;
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

	async function courseChaptersById(args: { courseId: string }) {
		const { courseId } = args;
		const chapters = await db
			.select()
			.from(db.schema.courseChapters)
			.where(eq(db.schema.courseChapters.courseId, courseId))
			.orderBy(db.schema.courseChapters.order);

		return chapters;
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

	async function chapterPagesById(args: { chapterId: string }) {
		const { chapterId } = args;

		const pages = await db
			.select()
			.from(db.schema.chapterPages)
			.where(eq(db.schema.chapterPages.chapterId, chapterId))
			.orderBy(db.schema.chapterPages.order);

		return pages;
	}

	async function userFollowing(args: { userWallet: Address }) {
		const { userWallet } = args;

		const following = await db
			.select({ following: db.schema.followings.following })
			.from(db.schema.followings)
			.where(eq(db.schema.followings.follower, userWallet))
			.orderBy(db.schema.followings.createdAt);

		return following;
	}

	async function userFollowers(args: { userWallet: Address }) {
		const { userWallet } = args;

		const followers = await db
			.select({ follower: db.schema.followings.follower })
			.from(db.schema.followings)
			.where(eq(db.schema.followings.following, userWallet))
			.orderBy(db.schema.followings.createdAt);

		return followers;
	}

	async function userFriends(args: { userWallet: Address }) {
		const { userWallet } = args;
		// friends are mutual followers
		const following = await userFollowing({ userWallet });
		const followers = await userFollowers({ userWallet });

		const friends = following.filter((followed) =>
			followers.some((follower) => follower.follower === followed.following),
		);

		return friends.map((f) => f.following);
	}

	return {
		userEnrollments,
		enrollUserInCourse,
		chapterById,
		courseChaptersById,
		courseById,
		chapterPagesById,
		userFollowing,
		userFollowers,
		userFriends,
	};
}

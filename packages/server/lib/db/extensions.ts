// import type { Address } from "viem";
import { and, eq } from "drizzle-orm";
import type { Address } from "viem";
import type { DbClient } from "./client";
import schema from "./schema";

// type DbClient = ReturnType<typeof createDbClient>;

export function dbExtensionHelpers(db: DbClient) {
	async function userEnrollments(args: { userWallet: Address }) {
		const { userWallet } = args;

		const enrollments = await db
			.select()
			.from(schema.userCourses)
			.where(eq(schema.userCourses.userWallet, userWallet))
			.orderBy(schema.userCourses.createdAt);

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
			.from(schema.userCourses)
			.where(
				and(
					eq(schema.userCourses.userWallet, userWallet),
					eq(schema.userCourses.courseId, course.id),
				),
			);

		if (existingEnrollment) {
			throw "User is already enrolled in the given course.";
		}

		const [enrollment] = await db
			.insert(schema.userCourses)
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
			.from(schema.courses)
			.where(eq(schema.courses.id, courseId));

		if (!course || course.deletedAt) {
			return null;
		}

		const topics = await db
			.select()
			.from(schema.courseTopics)
			.where(eq(schema.courseTopics.courseId, courseId));

		return {
			...course,
			topics,
		};
	}

	async function courseChaptersById(args: { courseId: string }) {
		const { courseId } = args;
		const chapters = await db
			.select()
			.from(schema.courseChapters)
			.where(eq(schema.courseChapters.courseId, courseId))
			.orderBy(schema.courseChapters.order);

		return chapters;
	}

	async function chapterById(args: { chapterId: string }) {
		const { chapterId } = args;

		const [chapter] = await db
			.select()
			.from(schema.courseChapters)
			.where(eq(schema.courseChapters.id, chapterId));

		if (!chapter) {
			return null;
		}

		const [course] = await db
			.select()
			.from(schema.courses)
			.where(eq(schema.courses.id, chapter.courseId));

		if (!course || course.deletedAt) {
			return null;
		}

		const chapterTopicsList = await db
			.select()
			.from(schema.chapterTopics)
			.where(eq(schema.chapterTopics.chapterId, chapter.id));

		return {
			...chapter,
			topics: chapterTopicsList.map((t) => t.topic),
		};
	}

	async function chapterPagesById(args: { chapterId: string }) {
		const { chapterId } = args;

		const pages = await db
			.select()
			.from(schema.chapterPages)
			.where(eq(schema.chapterPages.chapterId, chapterId))
			.orderBy(schema.chapterPages.order);

		return pages;
	}

	async function userByWallet(args: { userWallet: Address }) {
		const { userWallet } = args;

		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.walletAddress, userWallet));

		return user;
	}

	async function userFollowing(args: { userWallet: Address }) {
		const { userWallet } = args;

		const following = await db
			.select({ following: schema.followings.following })
			.from(schema.followings)
			.where(eq(schema.followings.follower, userWallet))
			.orderBy(schema.followings.createdAt);

		return following;
	}

	async function userFollowers(args: { userWallet: Address }) {
		const { userWallet } = args;

		const followers = await db
			.select({ follower: schema.followings.follower })
			.from(schema.followings)
			.where(eq(schema.followings.following, userWallet))
			.orderBy(schema.followings.createdAt);

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

	async function isUserFollowing(args: {
		userWallet: Address;
		targetWallet: Address;
	}) {
		const { userWallet, targetWallet } = args;

		const [following] = await db
			.select()
			.from(schema.followings)
			.where(
				and(
					eq(schema.followings.follower, userWallet),
					eq(schema.followings.following, targetWallet),
				),
			);

		return !!following;
	}

	return {
		userEnrollments,
		enrollUserInCourse,
		chapterById,
		courseChaptersById,
		courseById,
		chapterPagesById,
		userByWallet,
		userFollowing,
		userFollowers,
		userFriends,
		isUserFollowing,
	};
}

// import type { Address } from "viem";

import { jsonStringify } from "@pantha/shared";
import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { type Address, type Hex, keccak256, toHex, verifyMessage } from "viem";
import { InvalidStateError } from "../errors";
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
			topics: topics.map((t) => t.topic),
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

	async function userFriendsWithStreaks(args: { userWallet: Address }) {
		const { userWallet } = args;
		const friends = await userFriends({ userWallet });

		const streaks = friends.length
			? await db
					.select()
					.from(schema.friendStreaks)
					.where(
						or(
							and(
								eq(schema.friendStreaks.userWallet1, userWallet),
								inArray(schema.friendStreaks.userWallet2, friends),
							),
							and(
								inArray(schema.friendStreaks.userWallet1, friends),
								eq(schema.friendStreaks.userWallet2, userWallet),
							),
						),
					)
			: [];

		return friends.map((friendWallet) => {
			const streak = streaks.find(
				(s) =>
					(s.userWallet1 === userWallet && s.userWallet2 === friendWallet) ||
					(s.userWallet1 === friendWallet && s.userWallet2 === userWallet),
			);
			return {
				wallet: friendWallet,
				streak: {
					currentStreak: streak?.currentStreak ?? 0,
					lastActiveDate: streak?.lastActiveDate ?? null,
				},
			};
		});
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

	async function isUserFriend(args: {
		userWallet: Address;
		targetWallet: Address;
	}) {
		const { userWallet, targetWallet } = args;

		const following = await isUserFollowing({ userWallet, targetWallet });
		const followedBy = await isUserFollowing({
			userWallet: targetWallet,
			targetWallet: userWallet,
		});

		return following && followedBy;
	}

	async function searchUsersByUsername(args: {
		query: string;
		limit?: number;
	}) {
		const { query, limit = 10 } = args;

		const users = await db
			.select({
				walletAddress: schema.users.walletAddress,
				username: schema.users.username,
				name: schema.users.name,
			})
			.from(schema.users)
			.where(like(schema.users.username, `%${query}%`))
			.limit(limit);

		return users;
	}

	async function userActionPreviousHash(args: { userWallet: Address }) {
		const { userWallet } = args;

		const [prev] = await db
			.select()
			.from(schema.userActions)
			.where(and(eq(schema.userActions.userWallet, userWallet)))
			.orderBy(desc(schema.userActions.createdAt))
			.limit(1);

		return prev ? prev.hash : keccak256(toHex("GENESIS"));
	}

	async function registerAction(args: {
		label: string;
		userWallet: Address;
		data: Record<string, unknown>;
		signature: Hex;
	}) {
		const { data, label, userWallet, signature } = args;

		const prevHash = await userActionPreviousHash({ userWallet });

		const message = jsonStringify({
			prevHash,
			userWallet,
			label,
			data,
		});

		const hash = keccak256(toHex(message));

		const valid = verifyMessage({
			address: userWallet,
			message,
			signature,
		});

		if (!valid) {
			throw new InvalidStateError("Invalid signature for user action.");
		}

		const [action] = await db
			.insert(schema.userActions)
			.values({
				hash,
				label,
				userWallet,
				prevHash,
				data,
				signature,
			})
			.returning();

		return action;
	}

	const LIMIT_PER_PAGE_MESSAGES_BY_PARTICIPANTS = 30;
	async function messagesByParticipants(args: {
		userWallet1: Address;
		userWallet2: Address;
		offset?: number;
	}) {
		const { userWallet1, userWallet2, offset = 0 } = args;

		const messages = await db
			.select()
			.from(schema.personalMessages)
			.where(
				or(
					and(
						eq(schema.personalMessages.senderWallet, userWallet1),
						eq(schema.personalMessages.recipientWallet, userWallet2),
					),
					and(
						eq(schema.personalMessages.senderWallet, userWallet2),
						eq(schema.personalMessages.recipientWallet, userWallet1),
					),
				),
			)
			.orderBy(desc(schema.personalMessages.id))
			.offset(offset)
			.limit(LIMIT_PER_PAGE_MESSAGES_BY_PARTICIPANTS);

		return messages;
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
		userFriendsWithStreaks,
		isUserFollowing,
		isUserFriend,
		searchUsersByUsername,
		userActionPreviousHash,
		registerAction,
		messagesByParticipants,
	};
}

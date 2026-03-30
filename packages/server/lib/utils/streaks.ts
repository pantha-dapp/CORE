import { dateInTimezone, yesterdayOf } from "@pantha/shared";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Address } from "viem";
import type { Db } from "../db";
import { sse } from "./sse";

export async function registerActivityForStreaks(db: Db, userWallet: Address) {
	const [user] = await db
		.select()
		.from(db.schema.users)
		.where(eq(db.schema.users.walletAddress, userWallet));
	if (!user) {
		throw new Error(`User with wallet ${userWallet} not found`);
	}

	const { timezone: userTimezone } = user;
	if (!userTimezone) {
		console.warn(`User with wallet ${userWallet} does not have a timezone set`);
		return;
	}

	const today = dateInTimezone(userTimezone);
	const yesterday = yesterdayOf(today);

	await db
		.insert(db.schema.userDailyActivity)
		.values({
			userWallet,
			date: today,
		})
		.onConflictDoNothing()
		.returning();

	await db.transaction(async (tx) => {
		const [existingStreak] = await tx
			.select()
			.from(db.schema.userStreaks)
			.where(eq(db.schema.userStreaks.userId, userWallet));

		if (!existingStreak) {
			await tx.insert(db.schema.userStreaks).values({
				userId: userWallet,
				currentStreak: 1,
				lastActiveDate: today,
			});

			sse.emitToUser({
				userWallet: userWallet,
				type: "streak:extended",
				payload: {
					currentStreak: 1,
				},
			});
		} else if (existingStreak.lastActiveDate === today) {
			// already counted today, nothing to do
		} else if (existingStreak.lastActiveDate === yesterday) {
			await tx
				.update(db.schema.userStreaks)
				.set({
					currentStreak: sql`${db.schema.userStreaks.currentStreak} + 1`,
					lastActiveDate: today,
				})
				.where(eq(db.schema.userStreaks.userId, userWallet));

			sse.emitToUser({
				userWallet: userWallet,
				type: "streak:extended",
				payload: {
					currentStreak: existingStreak.currentStreak + 1,
				},
			});
		} else {
			await tx
				.update(db.schema.userStreaks)
				.set({
					currentStreak: 1,
					lastActiveDate: today,
				})
				.where(eq(db.schema.userStreaks.userId, userWallet));
		}

		const friends = await db.userFriends({ userWallet });
		if (friends.length === 0) return;

		const activeFriendsToday = await tx
			.select({ userWallet: db.schema.userDailyActivity.userWallet })
			.from(db.schema.userDailyActivity)
			.where(
				and(
					inArray(db.schema.userDailyActivity.userWallet, friends),
					eq(db.schema.userDailyActivity.date, today),
				),
			);
		const activeFriendSet = new Set(
			activeFriendsToday.map((f) => f.userWallet),
		);

		for (const friendWallet of activeFriendSet) {
			const userA = userWallet < friendWallet ? userWallet : friendWallet;
			const userB = userWallet < friendWallet ? friendWallet : userWallet;

			const [friendStreak] = await tx
				.select()
				.from(db.schema.friendStreaks)
				.where(
					and(
						eq(db.schema.friendStreaks.userWallet1, userA),
						eq(db.schema.friendStreaks.userWallet2, userB),
					),
				);

			if (!friendStreak) {
				// first time we detect mutual activity
				await tx.insert(db.schema.friendStreaks).values({
					userWallet1: userA,
					userWallet2: userB,
					currentStreak: 1,
					lastActiveDate: today,
				});

				sse.emitToUser({
					userWallet: userWallet,
					type: "friend-streak:extended",
					payload: {
						friendWallet: friendWallet,
						currentStreak: 1,
					},
				});
				sse.emitToUser({
					userWallet: friendWallet,
					type: "friend-streak:extended",
					payload: {
						friendWallet: userWallet,
						currentStreak: 1,
					},
				});

				if (Math.random() < 1 / 3) {
					await db.insert(db.schema.feedpost).values([
						{
							userWallet: userWallet,
							payload: {
								type: "friend-streak-extension",
								friendWallet,
								newStreak: 1,
							},
						},
						{
							userWallet: friendWallet,
							payload: {
								type: "friend-streak-extension",
								friendWallet: userWallet,
								newStreak: 1,
							},
						},
					]);
				}
				continue;
			}

			if (friendStreak.lastActiveDate === today) {
				// already counted today, nothing to do
				continue;
			}

			if (friendStreak.lastActiveDate === yesterday) {
				// continue an existing streak
				const newStreak = friendStreak.currentStreak + 1;
				await tx
					.update(db.schema.friendStreaks)
					.set({
						currentStreak: sql`${db.schema.friendStreaks.currentStreak} + 1`,
						lastActiveDate: today,
					})
					.where(
						and(
							eq(db.schema.friendStreaks.userWallet1, userA),
							eq(db.schema.friendStreaks.userWallet2, userB),
						),
					);

				sse.emitToUser({
					userWallet: userWallet,
					type: "friend-streak:extended",
					payload: {
						friendWallet: friendWallet,
						currentStreak: newStreak,
					},
				});
				sse.emitToUser({
					userWallet: friendWallet,
					type: "friend-streak:extended",
					payload: {
						friendWallet: userWallet,
						currentStreak: newStreak,
					},
				});

				if (Math.random() < 1 / 3) {
					await db.insert(db.schema.feedpost).values([
						{
							userWallet: userWallet,
							payload: {
								type: "friend-streak-extension",
								friendWallet,
								newStreak,
							},
						},
						{
							userWallet: friendWallet,
							payload: {
								type: "friend-streak-extension",
								friendWallet: userWallet,
								newStreak,
							},
						},
					]);
				}
			} else {
				// streak broken, reset
				await tx
					.update(db.schema.friendStreaks)
					.set({
						currentStreak: 1,
						lastActiveDate: today,
					})
					.where(
						and(
							eq(db.schema.friendStreaks.userWallet1, userA),
							eq(db.schema.friendStreaks.userWallet2, userB),
						),
					);
			}
		}
	});
}

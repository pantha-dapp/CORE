import { dateInTimezone, yesterdayOf } from "@pantha/shared";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Address } from "viem";
import type { IanaTimezone } from "../../data/timezones";
import db from "../db";

export async function registerActivity(
	userWallet: Address,
	userTimezone: IanaTimezone,
) {
	await db
		.update(db.schema.users)
		.set({ lastActiveAt: new Date() })
		.where(eq(db.schema.users.walletAddress, userWallet));

	const today = dateInTimezone(userTimezone);
	const yesterday = yesterdayOf(today);

	await db.transaction(async (tx) => {
		const [insertion] = await tx
			.insert(db.schema.userDailyActivity)
			.values({
				userWallet,
				date: today,
			})
			.onConflictDoNothing()
			.returning();
		if (!insertion) {
			return;
		}

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
			return;
		} else {
			if (existingStreak.lastActiveDate === yesterday) {
				await tx
					.update(db.schema.userStreaks)
					.set({
						currentStreak: sql`${db.schema.userStreaks.currentStreak} + 1`,
						lastActiveDate: today,
					})
					.where(eq(db.schema.userStreaks.userId, userWallet));
			} else {
				await tx
					.update(db.schema.userStreaks)
					.set({
						currentStreak: 1,
						lastActiveDate: today,
					})
					.where(eq(db.schema.userStreaks.userId, userWallet));
			}
		}

		const friends = await db.userFriends({ userWallet });
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
				// first time we decetect mutual activity
				await tx.insert(db.schema.friendStreaks).values({
					userWallet1: userA,
					userWallet2: userB,
					currentStreak: 1,
					lastActiveDate: today,
				});
				continue;
			}

			if (friendStreak.lastActiveDate === yesterday) {
				// continu an existingstreak
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
			} else {
				// streak broken, omg! reset
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

import { zEvmAddress } from "@pantha/shared/zod";
import { and, eq, lte, or, sql, sum } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import { Hono } from "hono";
import z from "zod";
import { ianaTimeZones } from "../../../data/timezones";
import schema from "../../../lib/db/schema";
import { NotFoundError } from "../../../lib/errors";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";
import social from "./social";

export default new Hono()

	.route("/social", social)

	.get(
		"/search",
		authenticated,
		validator("query", z.object({ q: z.string().min(1).max(50) })),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { q } = ctx.req.valid("query");

			const users = await db.searchUsersByUsername({ query: q });

			return respond.ok(ctx, { users }, "Users search completed", 200);
		},
	)

	.put(
		"/me",
		authenticated,
		validator(
			"json",
			createUpdateSchema(schema.users, {
				timezone: z.enum(ianaTimeZones),
			}).pick({
				name: true,
				username: true,
				profileVisibility: true,
			}),
		),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const updateData = ctx.req.valid("json");

			const [updatedUser] = await db
				.update(db.schema.users)
				.set(updateData)
				.where(eq(db.schema.users.walletAddress, userWallet))
				.returning();

			if (!updatedUser) {
				return respond.err(ctx, "User not found", 404);
			}

			return respond.ok(
				ctx,
				{ user: updatedUser },
				"User updated successfully",
				200,
			);
		},
	)

	.get(
		"/:wallet/followers",
		authenticated,
		validator("param", z.object({ wallet: zEvmAddress() })),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { wallet } = ctx.req.valid("param");

			const followers = await db.userFollowers({ userWallet: wallet });

			return respond.ok(
				ctx,
				{ followers: followers.map((f) => f.follower) },
				"Followers fetched successfully",
				200,
			);
		},
	)

	.get(
		"/:wallet/following",
		authenticated,
		validator("param", z.object({ wallet: zEvmAddress() })),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { wallet } = ctx.req.valid("param");

			const following = await db.userFollowing({ userWallet: wallet });

			return respond.ok(
				ctx,
				{ following: following.map((f) => f.following) },
				"Following fetched successfully",
				200,
			);
		},
	)

	.get(
		"/:wallet/courses",
		authenticated,
		validator("param", z.object({ wallet: zEvmAddress() })),
		async (ctx) => {
			const { db, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { wallet } = ctx.req.valid("param");

			await policyManager.assertCan(userWallet, "user.view", {
				userWallet: wallet,
			});

			const courses = await db.userEnrollments({ userWallet: wallet });

			return respond.ok(
				ctx,
				{ courses },
				"User's courses fetched successfully",
				200,
			);
		},
	)

	.post(
		"/follow",
		authenticated,
		validator("json", z.object({ walletToFollow: zEvmAddress() })),
		async (ctx) => {
			const { db, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { walletToFollow } = ctx.req.valid("json");

			await policyManager.assertCan(userWallet, "user.follow", {
				userWallet: walletToFollow,
			});

			await db
				.insert(db.schema.followings)
				.values({ follower: userWallet, following: walletToFollow })
				.onConflictDoNothing();

			return respond.ok(ctx, {}, "User followed successfully", 200);
		},
	)

	.post(
		"/unfollow",
		authenticated,
		validator("json", z.object({ walletToUnfollow: zEvmAddress() })),
		async (ctx) => {
			const { db, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { walletToUnfollow } = ctx.req.valid("json");

			await policyManager.assertCan(userWallet, "user.unfollow", {
				userWallet: walletToUnfollow,
			});

			await db
				.delete(db.schema.followings)
				.where(
					and(
						eq(db.schema.followings.follower, userWallet),
						eq(db.schema.followings.following, walletToUnfollow),
					),
				);

			return respond.ok(ctx, {}, "User unfollowed successfully", 200);
		},
	)

	.get(
		"/:wallet",
		authenticated,
		validator("param", z.object({ wallet: zEvmAddress() })),
		async (ctx) => {
			const { db, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { wallet } = ctx.req.valid("param");

			await policyManager.assertCan(userWallet, "user.view", {
				userWallet: wallet,
			});

			const user = await db.userByWallet({ userWallet: wallet });
			if (!user) {
				throw new NotFoundError("User not found");
			}

			const [streak] = await db
				.select()
				.from(db.schema.userStreaks)
				.where(eq(db.schema.userStreaks.userId, wallet));

			const xp = await db
				.select({
					totalXp: sum(db.schema.userXpLog.xpGained),
				})
				.from(db.schema.userXpLog)
				.where(
					and(
						eq(db.schema.userXpLog.userWallet, wallet),
						or(
							eq(db.schema.userXpLog.status, "success"),
							eq(db.schema.userXpLog.status, "pending"),
						),
					),
				)
				.then((rows) => rows[0]?.totalXp ?? "0");

			await db
				.delete(db.schema.userXpLog)
				.where(
					and(
						eq(db.schema.userXpLog.status, "pending"),
						lte(
							db.schema.userXpLog.createdAt,
							sql`unixepoch('now', '-5 minutes')`,
						),
					),
				);

			return respond.ok(
				ctx,
				{
					user: {
						walletAddress: user.walletAddress,
						name: user.name,
						username: user.username,
						timezone: user.timezone,
						streak: {
							currentStreak: streak?.currentStreak ?? 0,
							lastActiveDate: streak?.lastActiveDate ?? null,
						},
						profileVisibility: user.profileVisibility,
						xpCount: Number(xp),
						xp,
					},
				},
				"User fetched successfully",
				200,
			);
		},
	)

	.get(
		"/:wallet/friends",
		authenticated,
		validator("param", z.object({ wallet: zEvmAddress() })),
		async (ctx) => {
			const { db, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { wallet } = ctx.req.valid("param");

			await policyManager.assertCan(userWallet, "user.view", {
				userWallet: wallet,
			});

			const friends = await db.userFriendsWithStreaks({ userWallet: wallet });

			return respond.ok(
				ctx,
				{ friends },
				"User's friends fetched successfully",
				200,
			);
		},
	)

	.get(
		"/:wallet/profile",
		authenticated,
		validator("param", z.object({ wallet: zEvmAddress() })),
		async (ctx) => {
			const { db, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { wallet } = ctx.req.valid("param");

			await policyManager.assertCan(userWallet, "user.view", {
				userWallet: wallet,
			});

			const user = await db.userByWallet({ userWallet: wallet });
			if (!user) {
				throw new NotFoundError("User not found");
			}

			const [streak, courses, friends, followers, following] =
				await Promise.all([
					db
						.select()
						.from(db.schema.userStreaks)
						.where(eq(db.schema.userStreaks.userId, wallet))
						.then((rows) => rows[0] ?? null),
					db.userEnrollments({ userWallet: wallet }),
					db.userFriends({ userWallet: wallet }),
					db
						.userFollowers({ userWallet: wallet })
						.then((rows) => rows.map((r) => r.follower)),
					db
						.userFollowing({ userWallet: wallet })
						.then((rows) => rows.map((r) => r.following)),
				]);

			return respond.ok(
				ctx,
				{
					profile: {
						walletAddress: user.walletAddress,
						name: user.name,
						username: user.username,
						timezone: user.timezone,
						streak: {
							currentStreak: streak?.currentStreak ?? 0,
							lastActiveDate: streak?.lastActiveDate ?? null,
						},
						courses,
						friends,
						followers,
						following,
					},
				},
				"User profile fetched successfully",
				200,
			);
		},
	);

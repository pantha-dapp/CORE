import { zEvmAddress } from "@pantha/shared/zod";
import { and, eq } from "drizzle-orm";
import { createUpdateSchema } from "drizzle-zod";
import { Hono } from "hono";
import z from "zod";
import { ianaTimeZones } from "../../../data/timezones";
import schema from "../../../lib/db/schema";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import { validator } from "../../middleware/validator";
import social from "./social";

export default new Hono()

	.route("/social", social)

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

	.post(
		"/follow",
		authenticated,
		validator("json", z.object({ walletToFollow: zEvmAddress() })),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { walletToFollow } = ctx.req.valid("json");

			const userToFollow = await db.userByWallet({
				userWallet: walletToFollow,
			});
			if (!userToFollow) {
				return respond.err(ctx, "User to follow not found", 404);
			}
			if (walletToFollow === userWallet) {
				return respond.err(ctx, "Cannot follow yourself", 400);
			}

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
			const { db } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { walletToUnfollow } = ctx.req.valid("json");

			const userToUnfollow = await db.userByWallet({
				userWallet: walletToUnfollow,
			});
			if (!userToUnfollow) {
				return respond.err(ctx, "User to unfollow not found", 404);
			}
			if (walletToUnfollow === userWallet) {
				return respond.err(ctx, "Cannot unfollow yourself", 400);
			}

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

			policyManager.assertCan(userWallet, "user.view", {
				userWallet: wallet,
			});

			const user = await db.userByWallet({ userWallet: wallet });
			if (!user) {
				return respond.err(ctx, "User not found", 404);
			}

			const [streak] = await db
				.select()
				.from(db.schema.userStreaks)
				.where(eq(db.schema.userStreaks.userId, wallet));

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

			policyManager.assertCan(userWallet, "user.view", {
				userWallet: wallet,
			});

			const friends = await db.userFriends({ userWallet: wallet });

			return respond.ok(
				ctx,
				{ friends },
				"User's friends fetched successfully",
				200,
			);
		},
	);

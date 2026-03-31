import { tryCatch } from "@pantha/shared";
import { zEvmAddress, zHex } from "@pantha/shared/zod";
import { desc, eq, gte, inArray, sql, sum } from "drizzle-orm";
import { Hono } from "hono";
import { DateTime } from "luxon";
import z from "zod";
import { respond } from "../../../../lib/utils/respond";
import { sse } from "../../../../lib/utils/sse";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import type { RouterEnv } from "../../types";
import feed from "./feed";

const WEEKLY_LEADERBOARD_SIZE = 10;

export default new Hono<RouterEnv>()

	.route("/feed", feed)

	.post(
		"/keygen",
		authenticated,
		validator(
			"json",
			z.object({
				seedSalt: zHex(),
				challengeSalt: zHex(),
				publicKey: zHex(),
				signature: zHex(),
			}),
		),
		async (ctx) => {
			const { contracts } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { seedSalt, challengeSalt, publicKey, signature } =
				ctx.req.valid("json");

			const txHash = await tryCatch(
				contracts.PanthaKeyStore.write.registerKeygenData([
					userWallet,
					seedSalt,
					challengeSalt,
					publicKey,
					signature,
				]),
			);

			if (txHash.error) {
				console.error(
					"Failed to submit keygen data registration txn",
					txHash.error,
				);
				return respond.err(
					ctx,
					"Failed to submit keygen data registration txn",
					500,
				);
			}

			return respond.ok(
				ctx,
				{ txHash: txHash.data },
				"Keygen data registration txn submitted",
				201,
			);
		},
	)

	.post(
		"/dm",
		authenticated,
		validator(
			"json",
			z.object({
				ciphertext: zHex(),
				recipientWallet: zEvmAddress(),
			}),
		),
		async (ctx) => {
			const { db, policyManager } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { ciphertext, recipientWallet } = ctx.req.valid("json");

			await policyManager.assertCan(userWallet, "chat.dm", {
				userWallet: recipientWallet,
			});
			const message = await tryCatch(
				db
					.insert(db.schema.personalMessages)
					.values({
						senderWallet: userWallet,
						recipientWallet: recipientWallet,
						ciphertext: ciphertext,
					})
					.returning(),
			);

			if (message.error) {
				console.error("Failed to save message to database", message.error);
				return respond.err(ctx, "Failed to save message", 500);
			}

			sse.emitToUser({
				userWallet: recipientWallet,
				type: "dm:new",
				payload: {
					from: userWallet,
				},
			});

			return respond.ok(ctx, { message: message.data[0] }, "Message sent", 201);
		},
	)

	.get(
		"/dm",
		authenticated,
		validator(
			"query",
			z.object({
				participantWallet: zEvmAddress(),
				after: z.coerce.number().optional(),
				offset: z.coerce.number().default(0),
			}),
		),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { participantWallet, after, offset } = ctx.req.valid("query");

			const messages = await tryCatch(
				db.messagesByParticipants({
					userWallet1: userWallet,
					userWallet2: participantWallet,
					offset,
					after,
				}),
			);

			if (messages.error) {
				console.error("Failed to fetch messages from database", messages.error);
				return respond.err(ctx, "Failed to fetch messages", 500);
			}

			return respond.ok(
				ctx,
				{ messages: messages.data },
				"Messages fetched successfully",
				200,
			);
		},
	)

	.get("/groups", authenticated, async (ctx) => {
		const { db } = ctx.var.appState;
		const { userWallet } = ctx.var;

		const groups = await tryCatch(
			db.getLearningGroupMembershipsOfUser({
				userWallet,
			}),
		);

		if (groups.error) {
			console.error(
				"Failed to fetch learning groups from database",
				groups.error,
			);
			return respond.err(ctx, "Failed to fetch learning groups", 500);
		}

		return respond.ok(
			ctx,
			{ groups: groups.data },
			"Learning groups fetched successfully",
			200,
		);
	})

	.get(
		"/groups/:chatId/members",
		authenticated,
		validator(
			"param",
			z.object({
				chatId: z.coerce.number(),
			}),
		),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const chatId = ctx.req.valid("param").chatId;

			const members = await tryCatch(
				db.getLearningGroupChatMembers({
					chatId,
				}),
			);

			if (members.error) {
				console.error(
					"Failed to fetch learning group members from database",
					members.error,
				);
				return respond.err(ctx, "Failed to fetch learning group members", 500);
			}

			return respond.ok(
				ctx,
				{ members: members.data },
				"Learning group members fetched successfully",
				200,
			);
		},
	)

	.post(
		"/groups/:chatId/messages",
		authenticated,
		validator(
			"param",
			z.object({
				chatId: z.coerce.number(),
			}),
		),
		validator(
			"json",
			z.object({
				content: z.string().min(1),
			}),
		),
		async (ctx) => {
			const { db, policyManager, eventBus } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const { chatId } = ctx.req.valid("param");
			const { content } = ctx.req.valid("json");

			await policyManager.assertCan(userWallet, "chat.group_access", {
				learningGroupChatId: chatId,
			});

			const message = await tryCatch(
				db
					.insert(db.schema.learningGroupMessages)
					.values({
						learningGroupChatId: chatId,
						senderWallet: userWallet,
						content,
					})
					.returning(),
			);

			if (message.error) {
				console.error(
					"Failed to save learning group message to database",
					message.error,
				);
				return respond.err(ctx, "Failed to save learning group message", 500);
			}

			eventBus.emit("chat:group:message", {
				chatId,
				senderWallet: userWallet,
				message: content,
			});

			return respond.ok(
				ctx,
				{ message: message.data[0] },
				"Learning group message sent",
				201,
			);
		},
	)

	.get(
		"/groups/:chatId/messages",
		authenticated,
		validator(
			"param",
			z.object({
				chatId: z.coerce.number(),
			}),
		),
		validator(
			"query",
			z.object({
				offset: z.coerce.number().default(0),
			}),
		),
		async (ctx) => {
			const { db } = ctx.var.appState;
			const { chatId } = ctx.req.valid("param");
			const { offset } = ctx.req.valid("query");

			const messages = await tryCatch(
				db.getLearningGroupChatMessages({ chatId, offset }),
			);

			if (messages.error) {
				console.error(
					"Failed to fetch learning group messages from database",
					messages.error,
				);
				return respond.err(ctx, "Failed to fetch learning group messages", 500);
			}

			return respond.ok(
				ctx,
				{ messages: messages.data },
				"Learning group messages fetched successfully",
				200,
			);
		},
	)

	.get("/leaderboard/weekly", authenticated, async (ctx) => {
		const { db } = ctx.var.appState;
		const { userWallet } = ctx.var;

		const [user] = await db
			.select()
			.from(db.schema.users)
			.where(eq(db.schema.users.walletAddress, userWallet));
		if (!user) {
			console.error("User not found in database", userWallet);
			return respond.err(ctx, "User not found", 404);
		}

		const now = DateTime.now().setZone(user.timezone);

		const userWeekStart = now.startOf("week");
		const userWeekStartsAt = userWeekStart.toUTC().toJSDate();

		const weeklyLeaderboard = await tryCatch(
			db
				.select({
					userWallet: db.schema.userXpLog.userWallet,
					totalXp: sql<number>`cast(${sum(db.schema.userXpLog.xpGained)} as integer)`,
					rank: sql<number>`rank() over (order by ${sum(db.schema.userXpLog.xpGained)} desc)`,
				})
				.from(db.schema.userXpLog)
				.where(gte(db.schema.userXpLog.createdAt, userWeekStartsAt))
				.limit(WEEKLY_LEADERBOARD_SIZE)
				.groupBy(db.schema.userXpLog.userWallet)
				.orderBy((fields) => desc(fields.totalXp)),
		);

		if (weeklyLeaderboard.error) {
			console.error(
				"Failed to fetch weekly leaderboard from database",
				weeklyLeaderboard.error,
			);
			return respond.err(ctx, "Failed to fetch weekly leaderboard", 500);
		}

		const leaderboard = weeklyLeaderboard.data;
		const userInLeaderboard = leaderboard.some(
			(e) => e.userWallet === userWallet,
		);

		if (!userInLeaderboard) {
			const rankedSubq = db
				.select({
					userWallet: db.schema.userXpLog.userWallet,
					totalXp:
						sql<number>`cast(${sum(db.schema.userXpLog.xpGained)} as integer)`.as(
							"totalXp",
						),
					rank: sql<number>`rank() over (order by ${sum(db.schema.userXpLog.xpGained)} desc)`.as(
						"rank",
					),
				})
				.from(db.schema.userXpLog)
				.where(gte(db.schema.userXpLog.createdAt, userWeekStartsAt))
				.groupBy(db.schema.userXpLog.userWallet)
				.as("ranked");

			const userRank = await tryCatch(
				db
					.select()
					.from(rankedSubq)
					.where(eq(rankedSubq.userWallet, userWallet)),
			);

			if (!userRank.error && userRank.data[0]) {
				leaderboard.push(userRank.data[0]);
			}
		}

		return respond.ok(
			ctx,
			{ leaderboard },
			"Weekly leaderboard fetched successfully",
			200,
		);
	})

	.get("/leaderboard/friends", authenticated, async (ctx) => {
		const { db } = ctx.var.appState;
		const { userWallet } = ctx.var;

		const friends = await db.userFriends({
			userWallet,
		});

		if (friends.length === 0) {
			return respond.ok(
				ctx,
				{ leaderboard: [] },
				"Friends leaderboard fetched successfully",
				200,
			);
		}

		const leaderboard = await tryCatch(
			db
				.select({
					userWallet: db.schema.userXpLog.userWallet,
					totalXp: sql<number>`cast(${sum(db.schema.userXpLog.xpGained)} as integer)`,
				})
				.from(db.schema.userXpLog)
				.where(inArray(db.schema.userXpLog.userWallet, friends))
				.groupBy(db.schema.userXpLog.userWallet)
				.orderBy((fields) => desc(fields.totalXp)),
		);

		if (leaderboard.error) {
			console.error(
				"Failed to fetch friends leaderboard from database",
				leaderboard.error,
			);
			return respond.err(ctx, "Failed to fetch friends leaderboard", 500);
		}

		return respond.ok(
			ctx,
			{ leaderboard: leaderboard.data },
			"Friends leaderboard fetched successfully",
			200,
		);
	});

import { tryCatch } from "@pantha/shared";
import { zEvmAddress, zHex } from "@pantha/shared/zod";
import { Hono } from "hono";
import z from "zod";
import { respond } from "../../../../lib/utils/respond";
import { sse } from "../../../../lib/utils/sse";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import type { RouterEnv } from "../../types";

export default new Hono<RouterEnv>()
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

			await sse.emitToUser(db.redis, {
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
				after: z.number().optional(),
				offset: z.number().default(0),
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
	);

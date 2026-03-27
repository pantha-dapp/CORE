import { tryCatch } from "@pantha/shared";
import { eq } from "drizzle-orm";
import { zeroAddress } from "viem";
import type { AppState } from "../../../../../api/routes/types";
import { sse } from "../../../../utils/sse";

export default function (appState: AppState) {
	const { eventBus: event, db, ai } = appState;

	event.on("chat:group:message", async ({ chatId, senderWallet }) => {
		const members = await tryCatch(db.getLearningGroupChatMembers({ chatId }));

		if (members.error) {
			console.error(
				"Failed to fetch learning group members from database",
				members.error,
			);
			return;
		}

		const recipientWallets = members.data
			.map((m) => m.walletAddress)
			.filter((w) => w !== senderWallet);

		await sse.emitToUsers(
			db.redis,
			recipientWallets,
			"learning-group:message",
			{
				learningGroupChatId: chatId,
				from: senderWallet,
			},
		);
	});

	event.on("chat:group:message", async ({ chatId, senderWallet, message }) => {
		const members = await tryCatch(db.getLearningGroupChatMembers({ chatId }));

		if (members.error) {
			console.error(
				"Failed to fetch learning group members from database",
				members.error,
			);
			return;
		}
		const taggedPeople =
			message.match(/@\w+/g)?.map((mention) => mention.slice(1)) || [];

		const taggedWallets = members.data
			.filter((m) => taggedPeople.includes(m.username))
			.map((m) => m.walletAddress);

		await sse.emitToUsers(db.redis, taggedWallets, "learning-group:tag", {
			learningGroupChatId: chatId,
			from: senderWallet,
		});
	});

	event.on("chat:group:message", async ({ chatId, senderWallet, message }) => {
		if (
			message.toLowerCase().includes("@pantha") ||
			message.toLowerCase().includes("@ai")
		) {
			const user = await db.userByWallet({ userWallet: senderWallet });
			if (!user) return;

			const [chat] = await db
				.select()
				.from(db.schema.learningGroupChats)
				.where(eq(db.schema.learningGroupChats.id, chatId));

			const aiResponse = await tryCatch(
				ai.llm.generateChatAiResponse({
					message: message,
					chatName: `${chat?.category ?? ""} LLearning Group`,
				}),
			);

			if (aiResponse.error) {
				console.error(
					"Failed to generate AI response for chat message",
					aiResponse.error,
				);
				return;
			}

			const responseMessage = aiResponse.data.response;
			responseMessage
				.replaceAll(/@pantha/gi, "")
				.replaceAll(/@ai/gi, "")
				.trim();

			const aiMessageId = await tryCatch(
				db
					.insert(db.schema.learningGroupMessages)
					.values({
						learningGroupChatId: chatId,
						senderWallet: zeroAddress,
						content: `@${user.username} ${responseMessage}`,
					})
					.returning({ id: db.schema.learningGroupMessages.id }),
			);
			const messageId = aiMessageId.data?.[0]?.id;
			if (aiMessageId.error || !messageId) {
				console.error(
					"Failed to insert AI response message into database",
					aiMessageId.error,
				);
				return;
			}

			const members = await tryCatch(
				db.getLearningGroupChatMembers({ chatId }),
			);

			if (members.error) {
				console.error(
					"Failed to fetch learning group members from database",
					members.error,
				);
				return;
			}

			await sse.emitToUsers(
				db.redis,
				members.data
					.map((m) => m.walletAddress)
					.filter((w) => w !== senderWallet),
				"learning-group:message",
				{
					learningGroupChatId: chatId,
					from: senderWallet,
				},
			);
		}
	});
}

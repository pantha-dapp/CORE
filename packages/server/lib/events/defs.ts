import { zEvmAddress } from "@pantha/shared/zod";
import z from "zod";

export const eventPayloadDefs = {
	"user.registered": z.object({
		walletAddress: zEvmAddress(),
	}),
	"user.logged_in": z.object({
		walletAddress: zEvmAddress(),
	}),

	"chapter.completed": z.object({
		walletAddress: zEvmAddress(),
		chapterId: z.string(),
		correct: z.number().optional(),
	}),
	"chapter.revised": z.object({
		walletAddress: zEvmAddress(),
		chapterId: z.string(),
		correct: z.number().optional(),
	}),

	"streak.extended": z.object({
		walletAddress: zEvmAddress(),
	}),

	"course.generate": z.object({
		walletAddress: zEvmAddress(),
		courseId: z.string(),
	}),

	"chat:group:message": z.object({
		chatId: z.number(),
		senderWallet: zEvmAddress(),
		message: z.string(),
	}),
};

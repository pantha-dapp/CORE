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
	}),

	"streak.extended": z.object({
		walletAddress: zEvmAddress(),
	}),
};

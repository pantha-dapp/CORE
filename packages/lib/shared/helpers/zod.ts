import { getAddress, type Hex, isAddress, isHex } from "viem";
import z from "zod";

export const zEvmAddress = () =>
	z
		.string()
		.refine((value) => isAddress(value), "Invalid Ethereum address")
		.transform((value) => getAddress(value));

export const zHex = () =>
	z
		.string()
		.refine((value) => isHex(value), "Invalid hex string")
		.transform((value) => value.toLowerCase() as Hex);

export const zSsePayloads = {
	"dm:new": z.object({
		from: zEvmAddress(),
	}),
	"learning-group:message": z.object({
		learningGroupChatId: z.number(),
		from: zEvmAddress(),
	}),
	"learning-group:tag": z.object({
		learningGroupChatId: z.number(),
		from: zEvmAddress(),
	}),
	"streak:extended": z.object({
		currentStreak: z.number(),
	}),
	"friend-streak:extended": z.object({
		friendWallet: zEvmAddress(),
		currentStreak: z.number(),
	}),
};

export type SseEventType = keyof typeof zSsePayloads;
export type SsePayloadOf<T extends SseEventType> = z.infer<
	(typeof zSsePayloads)[T]
>;

// Cast once here so generic lookups `zSsePayloadSchema[T]` resolve to `z.ZodType<SsePayloadOf<T>>`
export const zSsePayloadSchema = zSsePayloads as {
	[T in SseEventType]: z.ZodType<SsePayloadOf<T>>;
};

export const zSseEvent = () =>
	z
		.object({
			type: z.literal("dm:new"),
			userWallet: zEvmAddress(),
			payload: zSsePayloads["dm:new"],
		})
		.or(
			z.object({
				type: z.literal("learning-group:message"),
				userWallet: zEvmAddress(),
				payload: zSsePayloads["learning-group:message"],
			}),
		)
		.or(
			z.object({
				type: z.literal("learning-group:tag"),
				userWallet: zEvmAddress(),
				payload: zSsePayloads["learning-group:tag"],
			}),
		)
		.or(
			z.object({
				type: z.literal("streak:extended"),
				userWallet: zEvmAddress(),
				payload: zSsePayloads["streak:extended"],
			}),
		)
		.or(
			z.object({
				type: z.literal("friend-streak:extended"),
				userWallet: zEvmAddress(),
				payload: zSsePayloads["friend-streak:extended"],
			}),
		);

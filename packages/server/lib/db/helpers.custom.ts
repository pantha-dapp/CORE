import { jsonParse, jsonStringify } from "@pantha/shared";
import { customType } from "drizzle-orm/sqlite-core";
import z from "zod";
import { generateChapterPageOutputTypedSchema } from "../ai/tasks/generateChapterPage.schemas";

export const tPageContent = customType<{
	data: z.infer<typeof generateChapterPageOutputTypedSchema>;
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	toDriver(value) {
		return jsonStringify(value);
	},
	fromDriver(value) {
		return generateChapterPageOutputTypedSchema.parse(jsonParse(value));
	},
});

export const tImageParts = customType<{
	data: { url: string | null; prompt: string };
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	toDriver(value) {
		return jsonStringify(value);
	},
	fromDriver(value) {
		return z
			.object({ url: z.url().nullable(), prompt: z.string() })
			.parse(jsonParse(value));
	},
});

const zFeedPostPayload = z
	.object({ type: z.literal("chapter-completion"), chapterId: z.string() })
	.or(z.object({ type: z.literal("streak-extension"), newStreak: z.number() }))
	.or(
		z.object({
			type: z.literal("friend-streak-extension"),
			friendWallet: z.string(),
			newStreak: z.number(),
		}),
	)
	.or(z.object({ type: z.literal("leaderboard-ranking"), rank: z.number() }));

export const tFeedPostPayload = customType<{
	data: z.infer<typeof zFeedPostPayload>;
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	toDriver(value) {
		return jsonStringify(value);
	},
	fromDriver(value) {
		return zFeedPostPayload.parse(jsonParse(value));
	},
});

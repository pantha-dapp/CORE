import { jsonParse, jsonStringify } from "@pantha/shared";
import { customType } from "drizzle-orm/sqlite-core";
import type z from "zod";
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

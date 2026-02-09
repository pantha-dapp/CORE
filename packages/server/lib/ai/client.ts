import type z from "zod";
import type { LanguageCode } from "../../data/languages";

export interface AiClient {
	llm: {
		text: (args: {
			prompt: string;
			systemPrompts?: string[];
		}) => Promise<string>;
		json: <T, R>(args: {
			prompt: string;
			input: T;
			outputSchema: z.ZodType<R>;
			systemPrompts?: string[];
		}) => Promise<R>;
	};
	embedding: {
		text: (input: string) => Promise<number[]>;
	};
	image: {
		generate: (args: { prompt: string }) => Promise<{ imageUrl: string }>;
	};
	translation: {
		generate: (args: {
			text: string;
			sourceLanguage: LanguageCode;
			targetLanguage: LanguageCode;
		}) => Promise<string>;
	};
}

import type z from "zod";
import type { LanguageCode } from "../../data/languages";

type JsonFunction = <T, R>(args: {
	prompt: string;
	input: T;
	outputSchema: z.ZodType<R>;
	systemPrompts?: string[];
}) => Promise<R>;

export interface AiClient {
	llm: {
		text: (args: {
			prompt: string;
			systemPrompts?: string[];
		}) => Promise<string>;
		json: JsonFunction;
		heal: (
			args: Parameters<JsonFunction>[0] & { failedGeneration: string },
		) => Promise<string>;
	};
	embedding: {
		text: (input: string) => Promise<number[]>;
	};
	image: {
		generate: (args: { prompt: string }) => Promise<{ buffer: Buffer }>;
	};
	translation: {
		generate: (args: {
			text: string;
			sourceLanguage: LanguageCode;
			targetLanguage: LanguageCode;
		}) => Promise<string>;
	};
}

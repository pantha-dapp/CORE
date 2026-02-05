import { jsonStringify } from "@pantha/shared";
import { chat } from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";
import type { ZodObject } from "zod";
import { z } from "zod";
import env from "../../env";
import { getCachedResponse, setCachedResponse } from "./cache";
import { type LanguageCode, languageCodesAndNames } from "./translations";

const aiAdapter = createOpenaiChat(
	//@ts-expect-error
	"openai/gpt-oss-120b",
	env.GROQ_API_KEY,
	{
		baseURL: "https://api.groq.com/openai/v1",
	},
);

export function createAiGenerateFunction<
	T extends ZodObject,
	R extends ZodObject,
>(
	schemas: {
		input: T;
		output: R;
	},
	systemPrompt: string,
) {
	async function aiGenerate(
		input: z.infer<T>,
		prompt?: string,
		noCache?: boolean,
	): Promise<z.infer<R>> {
		schemas.input.parse(input);
		const inputEmbedding = noCache
			? []
			: await generateEmbeddings(
					jsonStringify({ input, schemas, systemPrompt, prompt }),
				);

		if (!noCache) {
			const cachedResponse = await getCachedResponse<z.infer<R>>(
				inputEmbedding,
				schemas.output,
			);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		const response = await chat({
			adapter: aiAdapter,
			stream: false,
			messages: prompt
				? [{ role: "user", content: prompt }]
				: [{ role: "user", content: JSON.stringify(input) }],
			systemPrompts: [systemPrompt ?? ""],
			outputSchema: schemas.output,
		});

		if (!noCache) {
			setCachedResponse(response, inputEmbedding);
		}

		return schemas.output.parse(response);
	}

	return aiGenerate;
}

export async function generateEmbeddings(
	input: string | Record<string, unknown>,
) {
	const payload = await fetch(`${env.OLLAMA_HOST}/v1/embeddings`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "embeddinggemma:300m",
			input: input,
		}),
	});

	const data = await payload.json();

	const parsed = z
		.object({
			data: z.array(
				z.object({
					object: z.string(),
					embedding: z.array(z.number()),
					index: z.number(),
				}),
			),
		})
		.parse(data);

	const embedding = parsed.data.find(
		(i) => i.object === "embedding",
	)?.embedding;

	if (!embedding) {
		throw new Error("Failed to generate embedding");
	}

	return embedding;
}

export async function generateTranslation(args: {
	sourceLanguage: LanguageCode;
	targetLanguage: LanguageCode;
	input: string;
}) {
	const { input, sourceLanguage, targetLanguage } = args;

	const payload = await fetch(`${env.OLLAMA_HOST}/api/chat`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "translategemma:4b",
			stream: false,
			messages: [
				{
					role: "user",
					content: `You are a professional ${languageCodesAndNames[sourceLanguage]} (${sourceLanguage}) to ${languageCodesAndNames[targetLanguage]} (${targetLanguage}) translator. Your goal is to accurately convey the meaning and nuances of the original ${languageCodesAndNames[sourceLanguage]} text while adhering to ${languageCodesAndNames[targetLanguage]} grammar, vocabulary, and cultural sensitivities.
Produce only the ${languageCodesAndNames[targetLanguage]} translation, without any additional explanations or commentary. Please translate the following ${languageCodesAndNames[sourceLanguage]} text into ${languageCodesAndNames[targetLanguage]}:

${input}`,
				},
			],
		}),
	});

	const data = await payload.json();

	const { message } = z
		.object({ message: z.object({ role: z.string(), content: z.string() }) })
		.parse(data);

	return message.content;
}

import {
	//  chat,
	generateImage as tanstackGenerateImage,
} from "@tanstack/ai";
import {
	//  createOpenaiChat,
	createOpenaiImage,
} from "@tanstack/ai-openai";
import { toJSONSchema, z } from "zod";
import { type LanguageCode, languageCodesAndNames } from "../../data/languages";
import env from "../../env";
import type { AiClient } from "./client";
// import { structuralRepairPrompt } from "./corrections";

export const aiAdapter: AiClient = {
	llm: {
		text: llmText,
		json: async (args) => {
			const resposne = await llmJson(args);
			return args.outputSchema.parse(JSON.parse(resposne));
		},
	},
	embedding: { text: generateEmbeddings },
	translation: { generate: generateTranslation },
	image: {
		generate: generateImage,
	},
};

// const chatAdapter = createOpenaiChat(
// 	//@ts-expect-error
// 	"gpt-oss-120b",
// 	env.CEREBRAS_API_KEY,
// 	{
// 		baseURL: "https://api.cerebras.ai/v1",
// 	},
// );

// const correctionAdapter = createOpenaiChat(
// 	//@ts-expect-error
// 	"gpt-oss-120b",
// 	env.CEREBRAS_API_KEY,
// 	{
// 		baseURL: "https://api.cerebras.ai/v1",
// 	},
// );

async function llmText(args: { prompt: string; systemPrompts?: string[] }) {
	const resp = await callOpenaiCompat({
		body: JSON.stringify({
			model: "gpt-oss-120b",
			messages: [
				...(args.systemPrompts
					? args.systemPrompts.map((prompt) => ({
							role: "system",
							content: prompt,
						}))
					: []),
				{
					role: "user",
					content: args.prompt,
				},
			],
		}),
	});

	const data = await resp.json();
	const parsed = z
		.object({
			choices: z.tuple([
				z.object({
					message: z.object({
						content: z.string(),
					}),
				}),
			]),
		})
		.safeParse(data);

	if (!parsed.success) {
		console.error("Failed to parse LLM response:", {
			data,
			error: parsed.error,
		});
		throw new Error("Failed to parse LLM response");
	}

	return parsed.data.choices[0].message.content;
}

async function llmJson<T, R>(args: {
	prompt: string;
	input: T;
	outputSchema: z.ZodType<R>;
	systemPrompts?: string[];
}) {
	const jsonSchema = toJSONSchema(args.outputSchema);

	const resp = await callOpenaiCompat({
		body: JSON.stringify({
			model: "gpt-oss-120b",
			messages: [
				...(args.systemPrompts
					? args.systemPrompts.map((prompt) => ({
							role: "system",
							content: prompt,
						}))
					: []),
				{
					role: "system",
					content: `You must respond with valid JSON that matches this schema: ${JSON.stringify(jsonSchema)}`,
				},
				{
					role: "user",
					content: args.prompt,
				},
				{
					role: "user",
					content: `input:\n${JSON.stringify(args.input)}`,
				},
			],
			response_format: {
				type: "json_object",
			},
		}),
	});

	const data = await resp.json();

	// Check if the response is an error
	if (data.error) {
		console.error("LLM API error:", data);
		throw new Error(
			`LLM API error: ${data.error.message || JSON.stringify(data.error)}`,
		);
	}

	const parsed = z
		.object({
			choices: z.tuple([
				z.object({
					message: z.object({
						content: z.string(),
					}),
				}),
			]),
		})
		.safeParse(data);

	if (!parsed.success) {
		console.error("Failed to parse LLM JSON response:", {
			data,
			error: parsed.error,
		});
		throw new Error("Failed to parse LLM JSON response");
	}

	return parsed.data.choices[0].message.content;
}

function callOpenaiCompat(args: Parameters<typeof fetch>[1]) {
	return fetch("https://api.cerebras.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
		},
		...args,
	});
}

async function generateEmbeddings(input: string) {
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

async function generateTranslation(args: {
	sourceLanguage: LanguageCode;
	targetLanguage: LanguageCode;
	text: string;
}) {
	const { text, sourceLanguage, targetLanguage } = args;

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

${text}`,
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

export async function generateImage(args: { prompt: string }) {
	const { prompt } = args;

	const response = await tanstackGenerateImage({
		adapter: imageAdapter,
		prompt: prompt,
		size: "1024x1024",
		numberOfImages: 1,
		modelOptions: {
			quality: "standard",
			style: "vivid",
			response_format: "url",
		},
	});

	const imageUrl = response.images.at(0)?.url;
	if (!imageUrl) {
		throw new Error("Failed to generate image");
	}

	return { imageUrl };
}
const imageAdapter = createOpenaiImage("dall-e-3", env.OPENAI_API_KEY, {
	moderation: "low",
	quality: "medium",
});

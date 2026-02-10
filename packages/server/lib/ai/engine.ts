import { chat, generateImage as tanstackGenerateImage } from "@tanstack/ai";
import { createOpenaiChat, createOpenaiImage } from "@tanstack/ai-openai";
import { z } from "zod";
import { type LanguageCode, languageCodesAndNames } from "../../data/languages";
import env from "../../env";
import type { AiClient } from "./client";

export const aiAdapter: AiClient = {
	llm: {
		text: async (args) => {
			const { prompt, systemPrompts } = args;

			const response = await chat({
				adapter: chatAdapter,
				stream: false,
				messages: [{ role: "user", content: prompt }],
				systemPrompts,
			});

			return response;
		},
		json: async (args) => {
			const { prompt, systemPrompts, outputSchema, input } = args;

			const response = await chat({
				adapter: chatAdapter,
				stream: false,
				messages: prompt
					? [{ role: "user", content: prompt }]
					: [{ role: "user", content: `${prompt}\n${JSON.stringify(input)}` }],
				systemPrompts,
				outputSchema,
			});

			return response;
		},
	},
	embedding: { text: generateEmbeddings },
	translation: { generate: generateTranslation },
	image: {
		generate: generateImage,
	},
};

const chatAdapter = createOpenaiChat(
	//@ts-expect-error
	"openai/gpt-oss-120b",
	env.GROQ_API_KEY,
	{
		baseURL: "https://api.groq.com/openai/v1",
	},
);

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

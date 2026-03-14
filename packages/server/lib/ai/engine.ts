import { toJSONSchema, z } from "zod";
import { type LanguageCode, languageCodesAndNames } from "../../data/languages";
import env from "../../env";
import { pngBufferToCompressedWebpBuffer } from "../utils/image";
import type { AiClient } from "./client";

export const aiAdapter: AiClient = {
	llm: {
		text: llmText,
		json: async (args) => {
			const response = await llmJson(args);
			const { data, error } = response;
			if (error || !data) {
				const healed = await jsonHeal({
					...args,
					failedGeneration: data ?? "{}",
				});
				return args.outputSchema.parse(JSON.parse(healed));
			}

			return args.outputSchema.parse(JSON.parse(data));
		},
		heal: jsonHeal,
	},
	embedding: { text: generateEmbeddings },
	translation: { generate: generateTranslation },
	image: {
		generate: generateImage,
	},
};

async function llmText(args: { prompt: string; systemPrompts?: string[] }) {
	const resp = await callOpenaiCompat({
		body: JSON.stringify({
			model: env.AI_LLM_TEXT_MODEL,
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
		signal: AbortSignal.timeout(180_000),
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
	}

	return {
		data: parsed.data?.choices[0].message.content,
		error: parsed.success ? null : parsed.error,
	};
}

async function jsonHeal(
	args: Parameters<typeof llmJson>[0] & { failedGeneration: string },
) {
	const jsonSchema = toJSONSchema(args.outputSchema);

	const resp = await callOpenaiCompat({
		signal: AbortSignal.timeout(180_000),
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
					content: `An Ai model has failed to generate valid JSON as requested. Your goal is to take the failed generation and fix it.  You will also be given the initial prompts and inputs so if any data is missing try to generate it. if any data must be deleted, delete it and prioritize restructuring to match the JSON over insertions or deletions. Always try to restructure whenever possible. here is the expected output Schema: ${JSON.stringify(jsonSchema)}.`,
				},
				{
					role: "user",
					content: `initial prompt: ${args.prompt}`,
				},
				{
					role: "user",
					content: `initial input:\n${JSON.stringify(args.input)}`,
				},
				{
					role: "user",
					content: `failed generation:\n${args.failedGeneration}`,
				},
			],
			response_format: {
				type: "json_object",
			},
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
		signal: AbortSignal.timeout(60_000),
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
			model: env.AI_EMBEDDING_TEXT_MODEL,
			input: input,
		}),
		signal: AbortSignal.timeout(15_000),
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
		signal: AbortSignal.timeout(30_000),
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

export async function generateImage(args: { prompt: string }, maxRetries = 3) {
	const { prompt } = args;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const resp = await fetch("https://api.openai.com/v1/images/generations", {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.OPENAI_API_KEY}`,
			},
			method: "POST",
			body: JSON.stringify({
				model: "gpt-image-1.5",
				prompt: prompt,
				n: 1,
				size: "1024x1024",
				quality: "low",
				background: "transparent",
			}),
			signal: AbortSignal.timeout(120_000),
		});

		if (!resp.ok) {
			const errorBody = z
				.object({
					error: z.object({ code: z.string(), message: z.string() }).optional(),
				})
				.safeParse(await resp.json());
			const error = errorBody.success ? errorBody.data : undefined;

			if (
				resp.status === 429 &&
				attempt < maxRetries &&
				error?.error?.code === "rate_limit_exceeded"
			) {
				const retryAfterHeader = resp.headers.get("retry-after");
				const retryMatch = error.error?.message?.match(
					/try again in (\d+(?:\.\d+)?)s/,
				);
				const waitSeconds = retryAfterHeader
					? Number(retryAfterHeader)
					: retryMatch
						? Number(retryMatch[1])
						: 15;
				const waitMs = Math.ceil(waitSeconds * 1000) + 1000;
				console.warn(
					`[generateImage] Rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`,
				);
				await Bun.sleep(waitMs);
				continue;
			}

			throw new Error(
				`OpenAI API error: ${JSON.stringify(errorBody.success ? errorBody.data : errorBody.error)}`,
			);
		}

		const data = (await resp.json()) as { data: [{ b64_json: string }] };
		const b64 = data.data[0].b64_json;
		const imageBuffer = Buffer.from(b64, "base64");
		const webpBuffer = await pngBufferToCompressedWebpBuffer(imageBuffer);

		return { buffer: webpBuffer };
	}

	throw new Error("generateImage: max retries exceeded");
}

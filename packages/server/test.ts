import z, { toJSONSchema } from "zod";
import type { AiClient } from "./lib/ai/client";

const _client: AiClient = {
	llm: {
		text: async (args) => {
			const response = await llmText(args);
			return response;
		},
		json: async (args) => {
			const response = await llmJson(args);
			return response;
		},
	},
};

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
					role: "user",
					content: args.prompt,
				},
				{
					role: "user",
					content: `input:\n${JSON.stringify(args.input)}`,
				},
			],
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "response",
					strict: true,
					schema: jsonSchema,
				},
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
		...args,
	});
}

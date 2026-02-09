import { jsonStringify } from "@pantha/shared";
import type { ZodObject, z } from "zod";
import type { VectorDbClient } from "../db/vec/client";
import { createAiCache } from "./cache";
import type { AiClient } from "./client";
import clarificationQuestionGenerator from "./tasks/clarificationQuestionGenerator";
import courseSelectionEvaluator from "./tasks/courseSelectionEvaluator";
import { generateChapterPageOutputTypedSchema } from "./tasks/generateChapterPage.schemas";
import generateChapterPages from "./tasks/generateChapterPages.legacy";
import generateIdealCourseDescriptor from "./tasks/generateIdealCourseDescriptor";
import generateNewCourseSkeleton from "./tasks/generateNewCourseSkeleton";
import intentClarification from "./tasks/intentClarification";
import learningIntentSummarizer from "./tasks/learningIntentSummarizer";

export function createAi(args: {
	aiClient: AiClient;
	vectorDbClient: VectorDbClient;
}) {
	const { aiClient, vectorDbClient } = args;
	const cache = createAiCache(vectorDbClient);

	function createLlmGenerateFunction<T extends ZodObject, R extends ZodObject>(
		schemas: {
			input: T;
			output: R;
		},
		systemPrompt: string,
	) {
		async function llmGenerate(
			input: z.infer<T>,
			prompt?: string,
			noCache?: boolean,
		): Promise<z.infer<R>> {
			schemas.input.parse(input);
			const inputEmbedding = noCache
				? []
				: await aiClient.embedding.text(
						jsonStringify({ systemPrompt, prompt, input }),
					);

			if (!noCache) {
				const cachedResponse = await cache.getCachedResponse<z.infer<R>>(
					inputEmbedding,
					schemas.output,
				);
				if (cachedResponse) {
					return cachedResponse;
				}
			}

			const response = await aiClient.llm.json({
				input: input,
				outputSchema: schemas.output,
				prompt: prompt ?? "",
				systemPrompts: [systemPrompt ?? ""],
			});

			if (!noCache) {
				cache.setCachedResponse(response, inputEmbedding);
			}

			return schemas.output.parse(response);
		}

		return llmGenerate;
	}

	const generateChapterPagesRaw = createLlmGenerateFunction(
		{
			input: generateChapterPages.inputSchema,
			output: generateChapterPages.outputSchema,
		},
		generateChapterPages.prompt,
	);
	const llm = {
		clarificationQuestionGenerator: createLlmGenerateFunction(
			{
				input: clarificationQuestionGenerator.inputSchema,
				output: clarificationQuestionGenerator.outputSchema,
			},
			clarificationQuestionGenerator.prompt,
		),
		courseSelectionEvaluator: createLlmGenerateFunction(
			{
				input: courseSelectionEvaluator.inputSchema,
				output: courseSelectionEvaluator.outputSchema,
			},
			courseSelectionEvaluator.prompt,
		),
		generateChapterPages: async (
			args: Parameters<typeof generateChapterPagesRaw>[0],
		) => {
			const result = await generateChapterPagesRaw(args);

			const parsed = generateChapterPageOutputTypedSchema
				.array()
				.safeParse(result.pages);

			if (!parsed.success) {
				console.error("Failed to validate generated pages", {
					error: String(parsed.error).slice(0, 255),
					result: jsonStringify(result),
				});
				throw new Error("Failed to validate generated pages");
			}

			return {
				pages: parsed.data,
			};
		},
		generateIdealCourseDescriptor: createLlmGenerateFunction(
			{
				input: generateIdealCourseDescriptor.inputSchema,
				output: generateIdealCourseDescriptor.outputSchema,
			},
			generateIdealCourseDescriptor.prompt,
		),
		generateNewCourseSkeleton: createLlmGenerateFunction(
			{
				input: generateNewCourseSkeleton.inputSchema,
				output: generateNewCourseSkeleton.outputSchema,
			},
			generateNewCourseSkeleton.prompt,
		),
		intentClarification: createLlmGenerateFunction(
			{
				input: intentClarification.inputSchema,
				output: intentClarification.outputSchema,
			},
			intentClarification.prompt,
		),
		learningIntentSummarizer: createLlmGenerateFunction(
			{
				input: learningIntentSummarizer.inputSchema,
				output: learningIntentSummarizer.outputSchema,
			},
			learningIntentSummarizer.prompt,
		),
	};

	return {
		llm,
		embedding: aiClient.embedding,
		translate: aiClient.translation.generate,
		$client: aiClient,
	};
}

export type Ai = ReturnType<typeof createAi>;

import { jsonStringify } from "@pantha/shared";
import type { ZodObject, z } from "zod";
import { createVectorDb, type VectorDbClient } from "../db/vec/client";
import type { ObjectStorageResourceKey } from "../objectStorage";
import type { ObjectStorageService } from "../objectStorage/service";
import { createAiCache } from "./cache";
import type { AiClient } from "./client";
import clarificationQuestionGenerator from "./tasks/clarificationQuestionGenerator";
import courseSelectionEvaluator from "./tasks/courseSelectionEvaluator";
import generateAnswerExplanation from "./tasks/generateAnswerExplanation";
import { generateChapterPageOutputTypedSchema } from "./tasks/generateChapterPage.schemas";
import generateChapterPages from "./tasks/generateChapterPages.legacy";
import generateIconImage from "./tasks/generateIconImage";
import generateIdealCourseDescriptor from "./tasks/generateIdealCourseDescriptor";
import generateNewCourseSkeleton from "./tasks/generateNewCourseSkeleton";
import generatePageImage from "./tasks/generatePageImage";
import intentClarification from "./tasks/intentClarification";
import learningIntentSummarizer from "./tasks/learningIntentSummarizer";

export function createAi(args: {
	aiClient: AiClient;
	vectorDbClient: VectorDbClient;
	objectStorage: ObjectStorageService;
}) {
	const { aiClient, vectorDbClient, objectStorage } = args;
	const llmCache = createAiCache(vectorDbClient);
	const imageProcessing: Record<string, Promise<{ url: string }>> = {};
	let _activeImageCount = 0;
	const _imageQueue: Array<() => void> = [];
	function acquireImageSlot(): Promise<void> {
		if (_activeImageCount < 2) {
			_activeImageCount++;
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			_imageQueue.push(() => {
				_activeImageCount++;
				resolve();
			});
		});
	}
	function releaseImageSlot() {
		_activeImageCount--;
		const next = _imageQueue.shift();
		if (next) next();
	}
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
				const cachedResponse = await llmCache.getCachedResponse<z.infer<R>>(
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
				llmCache.setCachedResponse(response, inputEmbedding);
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

			for (const page of result.pages) {
				const { success: parseSuccess, error: parseError } =
					generateChapterPageOutputTypedSchema.safeParse(page);
				if (!parseSuccess) {
					delete result.pages[result.pages.indexOf(page)];
				}
			}

			const parsed = generateChapterPageOutputTypedSchema
				.array()
				.safeParse(result.pages.filter((p) => !!p));

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
		generateAnswerExplanation: createLlmGenerateFunction(
			{
				input: generateAnswerExplanation.inputSchema,
				output: generateAnswerExplanation.outputSchema,
			},
			generateAnswerExplanation.prompt,
		),
	};

	const imagePromptOutputs = createVectorDb(
		vectorDbClient,
		"image-prompt-outputs",
	);
	async function findSimilarPregeneratedImage(embedding: number[]) {
		const [cachedEntry] = await imagePromptOutputs.querySimilar(embedding, 1);
		return cachedEntry;
	}
	async function generateOrFindImage(args: {
		prompt: string;
		key: ObjectStorageResourceKey;
		cacheThreshold?: number;
		similarityQueryOverride?: string;
	}) {
		const {
			prompt,
			cacheThreshold = 0.95,
			similarityQueryOverride,
			key,
		} = args;

		const hash = Bun.hash(prompt).toString(16).padStart(32, "0");
		const uuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;

		if (imageProcessing[uuid]) {
			return await imageProcessing[uuid];
		}

		imageProcessing[uuid] = (async () => {
			await acquireImageSlot();
			try {
				const inputEmbedding = await aiClient.embedding.text(
					similarityQueryOverride ?? prompt,
				);
				const similarImage = await findSimilarPregeneratedImage(inputEmbedding);
				if (similarImage && similarImage.score > cacheThreshold) {
					delete imageProcessing[uuid];
					return { url: similarImage.payload.imageUrl };
				}

				const { buffer } = await aiClient.image.generate({
					prompt: prompt,
				});

				const { hotStorage, persistentStorage } = objectStorage.upload({
					path: [key, uuid],
					data: buffer,
				});

				const { url: tmpUrl } = await hotStorage;

				persistentStorage.then(({ url }) => {
					imagePromptOutputs.writeEntry(uuid, {
						vector: inputEmbedding,
						payload: { imageUrl: url },
					});

					objectStorage.unloadHot({ path: [key, uuid] });
				});

				return { url: tmpUrl };
			} finally {
				releaseImageSlot();
			}
		})();

		return await imageProcessing[uuid];
	}
	type GenerateImageArgs = Pick<
		Parameters<typeof generateOrFindImage>[0],
		"prompt" | "cacheThreshold" | "similarityQueryOverride"
	>;

	const image = {
		generateIconImage: (args: GenerateImageArgs) =>
			generateOrFindImage({
				prompt: `${generateIconImage.prompt}\n${args.prompt}`,
				cacheThreshold: args.cacheThreshold ?? 0.85,
				similarityQueryOverride: `Icon: ${args.prompt}`,
				key: "course-icons",
			}),

		generatePageImage: (args: GenerateImageArgs) =>
			generateOrFindImage({
				prompt: `${generatePageImage.prompt}\n${args.prompt}`,
				cacheThreshold: args.cacheThreshold ?? 0.9,
				similarityQueryOverride: args.prompt,
				key: "chapter-page-images",
			}),
	};

	return {
		llm,
		image,
		embedding: aiClient.embedding,
		translate: aiClient.translation.generate,
		$client: aiClient,
	};
}

export type Ai = ReturnType<typeof createAi>;

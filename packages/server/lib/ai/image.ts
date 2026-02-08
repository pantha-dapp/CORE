import { generateImage as tanstackGenerateImage } from "@tanstack/ai";
import { createOpenaiImage } from "@tanstack/ai-openai";
import env from "../../env";
import { createVectorDbClient } from "../db/vec/client";
import { generateEmbeddings } from "./engine";

const imageAdapter = createOpenaiImage("dall-e-3", env.OPENAI_API_KEY, {
	moderation: "low",
	quality: "medium",
});
const vectorDb = createVectorDbClient("image-prompt-outputs");

async function findSimilarPregeneratedImage(embedding: number[]) {
	const [cachedEntry] = await vectorDb.querySimilar(embedding, 1);
	return cachedEntry;
}

export async function generateOrFindImage(
	prompt: string,
	cacheThreshold = 0.95,
	similarityQueryOverride?: string,
) {
	const inputEmbedding = await generateEmbeddings(
		similarityQueryOverride ?? prompt,
	);
	const similarImage = await findSimilarPregeneratedImage(inputEmbedding);
	if (similarImage && similarImage.score > cacheThreshold) {
		return { imageUrl: similarImage.payload.imageUrl };
	}

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

	vectorDb.writeEntry(Bun.hash(prompt).toString(), {
		vector: inputEmbedding,
		payload: { imageUrl },
	});

	return { imageUrl };
}

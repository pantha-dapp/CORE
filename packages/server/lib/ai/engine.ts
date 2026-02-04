import { jsonParse, jsonStringify } from "@pantha/shared";
import { MINUTE } from "@pantha/shared/constants";
import { chat } from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";
import { count, eq, sql } from "drizzle-orm";
import { type ZodObject, z } from "zod";
import env from "../../env";
import db from "../db";
import { createVectorDbClient } from "../db/vec/client";

const vectorDb = createVectorDbClient("llm-resp-vec-cache");

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
			: await generateEmbeddings(jsonStringify(input));

		if (!noCache) {
			const [cachedEntry] = vectorDb.querySimilar(inputEmbedding, 1);
			if (cachedEntry && cachedEntry.similarity > 0.95) {
				const [cachedResponse] = await db
					.select()
					.from(db.schema.vectorCache)
					.where(eq(db.schema.vectorCache.id, cachedEntry.id));

				if (cachedResponse) {
					const content = cachedResponse.content;
					const { success } = schemas.output.safeParse(jsonParse(content));

					if (success) {
						// register the cace hit but do not need to awai tit
						db.update(db.schema.vectorCache)
							.set({
								lastHitAt: Date.now(),
								hits: sql`${db.schema.vectorCache.hits} + 1`,
							})
							.where(eq(db.schema.vectorCache.id, cachedResponse.id));
						return jsonParse(content);
					}
				}
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
			db.insert(db.schema.vectorCache)
				.values({
					content: jsonStringify(response),
					lastHitAt: Date.now(),
				})
				.onConflictDoUpdate({
					target: db.schema.vectorCache.content,
					set: {
						lastHitAt: Date.now(),
					},
				})
				.returning()
				.then(([cacheEntry]) => {
					if (cacheEntry) {
						cacheMeta.count += 1;
						vectorDb.writeEntry(cacheEntry.id, inputEmbedding);
					}
				});

			cacheEviction();
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

const CACHE_EVICTION_TRIGGER_THRESHOLD = 500;
const CACHE_ENTRIES_TO_EVICT = 50;
const CACHE_EVICTION_POLICY: "lru" | "lfu" = "lfu";
const cacheMeta = {
	count: 0,
	lastEvictionAt: 0,
};

async function cacheEviction() {
	if (!cacheMeta.count || cacheMeta.count <= 0) {
		const [currentCount] = await db
			.select({ count: count() })
			.from(db.schema.vectorCache);
		if (!currentCount) {
			cacheMeta.count = 0;
			return;
		}
		cacheMeta.count = currentCount.count;
	}

	if (cacheMeta.count >= CACHE_EVICTION_TRIGGER_THRESHOLD) {
		if (Date.now() - cacheMeta.lastEvictionAt > 5 * MINUTE) {
			await db.transaction(async (tx) => {
				const entriesToEvict = await tx
					.select()
					.from(db.schema.vectorCache)
					.orderBy(
						// depeding on policy choose target column for ordering
						CACHE_EVICTION_POLICY === "lfu"
							? db.schema.vectorCache.hits
							: db.schema.vectorCache.lastHitAt,
					)
					.limit(CACHE_ENTRIES_TO_EVICT);

				for (const entry of entriesToEvict) {
					cacheMeta.count -= 1;
					await tx
						.delete(db.schema.vectorCache)
						.where(eq(db.schema.vectorCache.id, entry.id));
					vectorDb.deleteEntry(entry.id);
				}
			});
		}
	}
}

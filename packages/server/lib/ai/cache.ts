import { jsonParse, jsonStringify } from "@pantha/shared";
import { MINUTE } from "@pantha/shared/constants";
import { count, eq, sql } from "drizzle-orm";
import db from "../db";
import { createVectorDbClient } from "../db/vec/client";

const vectorDb = createVectorDbClient("llm-resp-vec-cache");

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

export async function getCachedResponse<T>(
	inputEmbedding: number[],
	outputSchema: { safeParse: (data: unknown) => { success: boolean } },
): Promise<T | null> {
	const [cachedEntry] = await vectorDb.querySimilar(inputEmbedding, 1);
	console.log(cachedEntry);
	if (cachedEntry && cachedEntry.score > 0.998877) {
		const [cachedResponse] = await db
			.select()
			.from(db.schema.vectorCache)
			.where(eq(db.schema.vectorCache.id, cachedEntry.id));

		if (cachedResponse) {
			const content = cachedResponse.content;
			const { success } = outputSchema.safeParse(jsonParse(content));

			if (success) {
				// register the cache hit but do not need to await it
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
	return null;
}

export async function setCachedResponse(
	response: unknown,
	inputEmbedding: number[],
) {
	db.insert(db.schema.vectorCache)
		.values({
			content: jsonStringify(response),
			lastHitAt: Date.now(),
		})
		// .onConflictDoUpdate({
		// 	target: db.schema.vectorCache.content,
		// 	set: {
		// 		lastHitAt: Date.now(),
		// 	},
		// })
		.returning()
		.then(([cacheEntry]) => {
			if (cacheEntry) {
				cacheMeta.count += 1;
				vectorDb.writeEntry(cacheEntry.id, {
					vector: inputEmbedding,
					payload: {},
				});
			}
		});

	cacheEviction();
}

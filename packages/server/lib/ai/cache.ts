import { jsonParse, jsonStringify } from "@pantha/shared";
import { MINUTE } from "@pantha/shared/constants";
import { createVectorDb, type VectorDbClient } from "../db/vec/client";

const CACHE_EVICTION_TRIGGER_THRESHOLD = 500;
const CACHE_ENTRIES_TO_EVICT = 50;
const CACHE_EVICTION_POLICY: "lru" | "lfu" = "lfu";
const cacheMeta = {
	count: 0,
	lastEvictionAt: 0,
};

export function createAiCache(vectorDbClient: VectorDbClient) {
	const vectorDb = createVectorDb(vectorDbClient, "llm-resp-vec-cache");

	async function cacheEviction() {
		if (!cacheMeta.count || cacheMeta.count <= 0) {
			const currentCount = await vectorDb.count();
			if (!currentCount) {
				cacheMeta.count = 0;
				return;
			}
			cacheMeta.count = currentCount;
		}

		if (
			cacheMeta.count >= CACHE_EVICTION_TRIGGER_THRESHOLD &&
			Date.now() - cacheMeta.lastEvictionAt > 5 * MINUTE
		) {
			if (CACHE_EVICTION_POLICY === "lfu") {
				const entriesToEvict = await vectorDb.$client.scroll(vectorDb.key, {
					order_by: {
						key: "hits",
						direction: "asc",
					},
					limit: CACHE_ENTRIES_TO_EVICT,
				});
				await vectorDb.$client.delete(vectorDb.key, {
					points: entriesToEvict.points.map((e) => e.id),
				});
			}
			if (CACHE_EVICTION_POLICY === "lru") {
				const entriesToEvict = await vectorDb.$client.scroll(vectorDb.key, {
					order_by: {
						key: "lastHitAt",
						direction: "asc",
					},
					limit: CACHE_ENTRIES_TO_EVICT,
				});
				await vectorDb.$client.delete(vectorDb.key, {
					points: entriesToEvict.points.map((e) => e.id),
				});
			}
		}
	}

	async function getCachedResponse<T>(
		inputEmbedding: number[],
		outputSchema: { safeParse: (data: unknown) => { success: boolean } },
	): Promise<T | null> {
		const [cachedEntry] = await vectorDb.querySimilar(inputEmbedding, 1);

		if (cachedEntry && cachedEntry.score > 0.998877) {
			const cachedResponse = cachedEntry.payload;

			if (cachedResponse) {
				const content = cachedResponse.content;
				const { success } = outputSchema.safeParse(jsonParse(content));

				if (success) {
					// register the cache hit but do not need to await it
					vectorDb.updatePayload(cachedEntry.id, {
						hits: cachedResponse.hits + 1,
						lastHitAt: Date.now(),
					});
					return jsonParse(content);
				}
			}
		}
		return null;
	}

	async function setCachedResponse(
		response: unknown,
		inputEmbedding: number[],
	) {
		vectorDb.writeEntry(crypto.randomUUID(), {
			vector: inputEmbedding,
			payload: {
				content: jsonStringify(response),
				hits: 0,
				lastHitAt: Date.now(),
			},
		});
		cacheEviction();
	}

	return {
		getCachedResponse,
		setCachedResponse,
	};
}

import { tryCatch } from "@pantha/shared";
import type { QdrantClient } from "@qdrant/js-client-rest";
import z from "zod";

const collectionDefinitions = {
	"course-embeddings": {
		size: 768,
		distance: "Cosine",
		schema: z.object({
			courseId: z.string(),
		}),
	},
	"llm-resp-vec-cache": {
		size: 768,
		distance: "Cosine",
		schema: z.object({
			content: z.string(),
			lastHitAt: z.number(),
			hits: z.number(),
			// vectorCacheId: z.string(),
		}),
	},
	"image-prompt-outputs": {
		size: 768,
		distance: "Cosine",
		schema: z.object({
			imageUrl: z.string(),
		}),
	},
} as const satisfies Record<
	string,
	{
		size: number;
		distance: "Cosine" | "Dot" | "Euclid" | "Manhattan";
		schema: z.ZodObject;
	}
>;

export type VectorDbClientKey = keyof typeof collectionDefinitions;
export type VectorDbClient = QdrantClient;

export function createVectorDb<T extends VectorDbClientKey>(
	vecDbClient: VectorDbClient,
	key: T,
) {
	const def = collectionDefinitions[key];
	vecDbClient
		.createCollection(key, {
			vectors: { size: def.size, distance: def.distance },
		})
		.catch((error) => {
			// Ignore 409 Conflict errors (collection already exists)
			if (error?.status !== 409) {
				throw error;
			}
		});

	type PayloadType = z.infer<(typeof collectionDefinitions)[T]["schema"]>;

	async function readEntry(id: string) {
		const entry = await vecDbClient.query(key, {
			query: id,
		});
		if (!entry) return null;
		const content = entry.points[0];
		if (entry.points.length > 1 || entry.points.length === 0 || !content) {
			throw new Error(
				"Invalid state: multiple or no entries found for id, maybe the id is not an id",
			);
		}

		const parsed = def.schema.safeParse(content.payload);
		if (!parsed.success) {
			throw new Error("Failed to parse payload:");
		}

		return {
			vector: z.array(z.number()).parse(content.vector),
			payload: parsed.data as PayloadType,
		};
	}

	async function writeEntry(
		id: string,
		options: {
			vector: number[];
			payload: PayloadType;
		},
	) {
		def.schema.parse(options.payload);
		await vecDbClient.upsert(key, {
			points: [
				{
					id,
					...options,
				},
			],
		});
	}

	async function deleteEntry(id: string) {
		const found = await tryCatch(readEntry(id));

		if (found.data) {
			await vecDbClient.delete(key, { filter: { must: { has_id: id } } });
		}
	}

	// async function all() {
	// 	const {} = await dbClient
	// 		.getCollection(key)

	// 	return z
	// 		.array(z.object({ id: z.string(), vector: z.instanceof(Uint8Array) }))
	// 		.parse(rows)
	// 		.map(({ id, vector }) => {
	// 			const floatArray = new Float32Array(
	// 				vector.buffer,
	// 				vector.byteOffset,
	// 				vector.byteLength / Float32Array.BYTES_PER_ELEMENT,
	// 			);
	// 			return {
	// 				id,
	// 				vector: Array.from(floatArray),
	// 			};
	// 		});
	// }

	async function count() {
		const { count } = await vecDbClient.count(key);
		return count;
	}

	async function querySimilar(vector: number[], k: number = 5) {
		const entries = await vecDbClient.query(key, {
			query: vector,
			limit: k,
			with_payload: true,
		});

		return entries.points.map((entry) => ({
			id: String(entry.id),
			score: z.number().parse(entry.score),
			payload: def.schema.parse(entry.payload) as PayloadType,
		}));
	}

	async function updatePayload(id: string, payload: Partial<PayloadType>) {
		const existing = await readEntry(id);
		if (!existing) {
			throw new Error("Entry not found");
		}
		def.schema.partial().parse(payload);

		const updatedPayload = {
			...existing.payload,
			...payload,
		} as PayloadType;

		await vecDbClient.setPayload(key, {
			points: [id],
			payload: updatedPayload,
		});
	}

	const client = {
		readEntry,
		writeEntry,
		deleteEntry,
		// all,
		count,
		querySimilar,
		updatePayload,
		$client: vecDbClient,
		key,
	};

	return client;
}

function _cosineSimilarity(a: number[], b: number[]) {
	if (a.length !== b.length) throw new Error("Vectors must be of same length");

	const dotProduct = a.reduce((sum, ai, i) => {
		if (!b[i]) return sum;
		return sum + ai * b[i];
	}, 0);
	const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
	const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
	if (magnitudeA === 0 || magnitudeB === 0) return 0;
	return dotProduct / (magnitudeA * magnitudeB);
}

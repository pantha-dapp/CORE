import { tryCatch } from "@pantha/shared";
import { QdrantClient } from "@qdrant/js-client-rest";
import z from "zod";
import env from "../../../env";

const dbClient = new QdrantClient({
	host: env.QDRANT_HOST,
	port: Number(env.QDRANT_PORT),
});

const collectionDefinitions = {
	"course-embeddings": {
		size: 768,
		distance: "Cosine",
		schema: z.object({
			//  courseId: z.string()
		}),
	},
	"llm-resp-vec-cache": {
		size: 768,
		distance: "Cosine",
		schema: z.object({
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

type VectorDbClientKey = keyof typeof collectionDefinitions;

async function ensureCollectionsExist() {
	await Promise.all(
		Object.entries(collectionDefinitions).map(async ([name, def]) => {
			const { exists } = await dbClient.collectionExists(name);
			if (!exists) {
				await dbClient.createCollection(name, {
					vectors: { size: def.size, distance: def.distance },
				});
			}
		}),
	);
}

export function createVectorDbClient<T extends VectorDbClientKey>(key: T) {
	ensureCollectionsExist();
	async function readEntry(id: string) {
		const entry = await dbClient.query(key, {
			query: id,
		});
		if (!entry) return null;
		const content = entry.points[0];
		if (entry.points.length > 1 || entry.points.length === 0 || !content) {
			throw new Error(
				"Invalid state: multiple or no entries found for id, maybe the id is not an id",
			);
		}

		const parsed = collectionDefinitions[key].schema.safeParse(content.payload);
		if (!parsed.success) {
			throw new Error("Failed to parse payload:");
		}

		return {
			vector: z.array(z.number()).parse(content.vector),
			payload: parsed.data,
		};
	}

	async function writeEntry(
		id: string,
		options: {
			vector: number[];
			payload: z.infer<(typeof collectionDefinitions)[T]["schema"]>;
		},
	) {
		await dbClient.upsert(key, {
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
			await dbClient.delete(key, { filter: { must: { has_id: id } } });
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

	async function querySimilar(vector: number[], k: number = 5) {
		const entries = await dbClient.query(key, {
			query: vector,
			limit: k,
			with_payload: true,
		});

		return entries.points.map((entry) => ({
			id: String(entry.id),
			score: z.number().parse(entry.score),
			payload: collectionDefinitions[key].schema.parse(entry.payload),
		}));
	}

	const client = {
		readEntry,
		writeEntry,
		deleteEntry,
		// all,
		querySimilar,
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

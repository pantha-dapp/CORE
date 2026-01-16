import { Database } from "bun:sqlite";
import z from "zod";
import env from "../../../env";

const dbFile = Bun.file(env.EMBEDDINGS_SQLITE_FILE_PATH);
if (!dbFile.exists()) {
	console.log(
		`Creating new embeddings database at ${env.EMBEDDINGS_SQLITE_FILE_PATH}`,
	);
	dbFile.write(new Uint8Array());
}

const db = new Database(env.EMBEDDINGS_SQLITE_FILE_PATH);
db.run(`
  CREATE TABLE IF NOT EXISTS vec_entries (
    key TEXT NOT NULL,
    id TEXT NOT NULL PRIMARY KEY,
    vector BLOB
  );

  CREATE INDEX IF NOT EXISTS idx_vec_entries_key ON vec_entries (key);
`);

type VectorDbClientKey = "course-embeddings";

export function createVectorDbClient(key: VectorDbClientKey) {
	function readEntry(id: string) {
		const [entry] = db
			.query("SELECT vector FROM vec_entries WHERE key = ? AND id = ?")
			.all(key, id);
		if (!entry) return null;
		return z.object({ vector: z.instanceof(Uint8Array) }).parse(entry).vector;
	}

	function writeEntry(id: string, vector: number[]) {
		const exists = readEntry(id);
		if (exists) {
			db.run("UPDATE vec_entries SET vector = ? WHERE key = ? AND id = ?", [
				Buffer.from(new Float32Array(vector).buffer),
				key,
				id,
			]);
		} else {
			db.run("INSERT INTO vec_entries (key, id, vector) VALUES (?, ?, ?)", [
				key,
				id,
				Buffer.from(new Float32Array(vector).buffer),
			]);
		}
	}

	function deleteEntry(id: string) {
		db.run("DELETE FROM vec_entries WHERE key = ? AND id = ?", [key, id]);
	}

	function all() {
		const rows = db
			.query("SELECT id, vector FROM vec_entries WHERE key = ?")
			.all(key);

		return z
			.array(z.object({ id: z.string(), vector: z.instanceof(Uint8Array) }))
			.parse(rows)
			.map(({ id, vector }) => {
				const floatArray = new Float32Array(
					vector.buffer,
					vector.byteOffset,
					vector.byteLength / Float32Array.BYTES_PER_ELEMENT,
				);
				return {
					id,
					vector: Array.from(floatArray),
				};
			});
	}

	function querySimilar(vector: number[], k: number = 5) {
		const entries = all();

		const similarities = entries.map(({ id, vector: vec }) => {
			const similarity = cosineSimilarity(vector, vec);
			return { id, similarity };
		});

		similarities.sort((a, b) => b.similarity - a.similarity);

		return similarities.slice(0, k).map((entry) => {
			return {
				id: entry.id,
				similarity: entry.similarity,
			};
		});
	}

	const client = {
		readEntry,
		writeEntry,
		deleteEntry,
		all,
		querySimilar,
	};

	return client;
}

function cosineSimilarity(a: number[], b: number[]) {
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

import type { Ai } from "../../lib/ai";
import type { Db } from "../../lib/db";
import type { VectorDbClient } from "../../lib/db/vec/client";

export type RouterEnv = {
	Variables: {
		db: Db;
		ai: Ai;
		vecDbClient: VectorDbClient;
	};
};

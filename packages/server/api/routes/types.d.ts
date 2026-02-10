import type { Ai } from "../../lib/ai";
import type { Db } from "../../lib/db";

export type RouterEnv = {
	Variables: {
		db: Db;
		ai: Ai;
	};
};

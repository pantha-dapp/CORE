import type { Db } from "../../lib/db";

export type RouterEnv = {
	Variables: {
		db: Db;
	};
};

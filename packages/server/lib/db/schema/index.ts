// import * as cache from "./cache";

import { createSelectSchema } from "drizzle-zod";
import * as course from "./course";
import * as engagement from "./engagement";
import * as social from "./social";
import * as user from "./user";

// Combine all schema parts
const schema = {
	// ...cache,
	...course,
	...engagement,
	...social,
	...user,
};

export default schema;

export type DbSchema = typeof schema;

// type DBSchema = typeof schema;
// export type DB = {
//   [K in keyof DBSchema as K extends `${infer Base}s` // Tables typically end with 's'
//     ? Base // Standard table name (convert 'users' to 'user', etc.)
//     : K extends UtilityFunctions // Exclude utility functions
//     ? never
//     : K]: K extends keyof DBSchema
//     ? DBSchema[K] extends { $inferSelect: any }
//       ? DBSchema[K]["$inferSelect"]
//       : never
//     : never;
// };

export const zDbSchema = () => {
	return {
		user: () => createSelectSchema(schema.users),
		course: () => createSelectSchema(schema.courses),
		chapter: () => createSelectSchema(schema.courseChapters),
		chapterPage: () => createSelectSchema(schema.chapterPages),
	};
};

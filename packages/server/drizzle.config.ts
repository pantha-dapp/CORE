import { defineConfig } from "drizzle-kit";
import env from "./env";

//@ts-expect-error
BigInt.prototype.toJSON = function () {
	return this.toString();
};

export default defineConfig({
	out: "./drizzle",
	schema: "./lib/db/schema",
	dialect: "sqlite",
	dbCredentials: {
		url: env.SQLITE_FILE_PATH,
	},
	casing: "snake_case",
});

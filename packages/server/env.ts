const envKeys = [
	"PORT",
	"OLLAMA_HOST",
	"QDRANT_HOST",
	"QDRANT_PORT",
	"FRONTEND_URL",
	"GROQ_API_KEY",
	"OPENAI_API_KEY",
	"SQLITE_FILE_PATH",
	"TG_ANALYTICS_BOT_TOKEN",
	"EVM_PRIVATE_KEY_SYNAPSE",
	"TG_ANALYTICS_BOT_GROUP_ID",
	"EMBEDDINGS_SQLITE_FILE_PATH",
] as const;

type ENV = Record<(typeof envKeys)[number], string>;

let env: ENV = {} as ENV;

export function ensureEnv() {
	for (const key of envKeys) {
		if (!Bun.env[key]) {
			throw new Error(`Environment variable ${key} is not set`);
		}
	}

	env = Object.fromEntries(envKeys.map((key) => [key, Bun.env[key]])) as ENV;
}
// const isProd =
// 	process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
// if (!isProd) ensureEnv();

const isProd =
	process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
if (!isProd) ensureEnv();

export default env;

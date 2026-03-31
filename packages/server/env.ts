const envKeys = [
	"PORT",
	"OLLAMA_HOST",
	"QDRANT_HOST",
	"QDRANT_PORT",
	"QDRANT_API_KEY",
	"FRONTEND_URL",
	"GROQ_API_KEY",
	"OPENAI_API_KEY",
	"REDIS_CONNECTION_URI",
	"SQLITE_FILE_PATH",
	"TG_ANALYTICS_BOT_TOKEN",
	"EVM_PRIVATE_KEY_SYNAPSE",
	"EVM_PRIVATE_KEY",
	"TG_ANALYTICS_BOT_GROUP_ID",
	"CEREBRAS_API_KEY",
	"AI_PROMPT_GUARD_MODEL",
	"AI_LLM_TEXT_MODEL",
	"AI_EMBEDDING_TEXT_MODEL",
	"S3_ACCESS_KEY_ID",
	"S3_SECRET_ACCESS_KEY",
	"S3_BUCKET",
	"S3_ENDPOINT",
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
ensureEnv();

export default env;

import type { AiClient } from "../../../lib/ai/client";

export const testAiAdapter: AiClient = {
	llm: {
		text: async () => {
			const response = "MOCK_RESPONSE";

			return response;
		},
		json: async () => {
			const response = {};

			return response;
		},
	},
	embedding: { text: async () => [1, 2, 3] },
	translation: { generate: async () => "MOCK_TRANSLATION" },
	image: {
		generate: async () => ({ imageUrl: "MOCK_IMAGE_URL" }),
	},
};

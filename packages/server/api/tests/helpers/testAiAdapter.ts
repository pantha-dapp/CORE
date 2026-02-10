import { jsonStringify } from "@pantha/shared";
import type z from "zod";
import type { AiClient } from "../../../lib/ai/client";
import clarificationQuestionGenerator from "../../../lib/ai/tasks/clarificationQuestionGenerator";
import courseSelectionEvaluator from "../../../lib/ai/tasks/courseSelectionEvaluator";
import generateIdealCourseDescriptor from "../../../lib/ai/tasks/generateIdealCourseDescriptor";
import intentClarification from "../../../lib/ai/tasks/intentClarification";
import learningIntentSummarizer from "../../../lib/ai/tasks/learningIntentSummarizer";

export const testAiAdapter: AiClient = {
	llm: {
		text: async () => {
			const response = "MOCK_RESPONSE";
			await sleep(500);
			return response;
		},
		json: async (args) => {
			const response = getMockLlmResponse(args.outputSchema, args.input);
			await sleep(500);
			return response;
		},
	},
	embedding: {
		text: async () => {
			return [1, 2, 3];
		},
	},
	translation: {
		generate: async () => {
			return "MOCK_TRANSLATION";
		},
	},
	image: {
		generate: async () => {
			await sleep(500);
			return { imageUrl: "MOCK_IMAGE_URL" };
		},
	},
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockLlmResponses: Record<string, Record<string, unknown>> = {};
function registerMockResponse<T extends z.ZodTypeAny, R extends z.ZodTypeAny>(
	config: { inputSchema: R; outputSchema: T; prompt: string },
	args: { input?: z.infer<R>; response: z.infer<T> },
) {
	config.outputSchema.parse(args.response);
	const responses = mockLlmResponses[jsonStringify(config.outputSchema)];
	if (!responses) {
		mockLlmResponses[jsonStringify(config.outputSchema)] = {
			[args.input ? jsonStringify(args.input) : "default"]: args.response,
		};
	} else {
		responses[args.input ? jsonStringify(args.input) : "default"] =
			args.response;
	}
}
function getMockLlmResponse<T extends z.ZodTypeAny>(
	outputSchema: T,
	input?: unknown,
) {
	const response = mockLlmResponses[jsonStringify(outputSchema)];
	if (!response) {
		throw new Error(`No mock response registered for schema: ${outputSchema}`);
	}
	const found = response[input ? jsonStringify(input) : "default"];
	return outputSchema.parse(found ?? response.default);
}

registerMockResponse(learningIntentSummarizer, {
	response: {
		summary: "MOCK_SUMMARY",
	},
});
registerMockResponse(intentClarification, {
	response: {
		inferredGoal: "MOCK_INFERRED_GOAL",
		uncertainties: ["MOCK_UNCERTAINTY_1", "MOCK_UNCERTAINTY_2"],
	},
});
registerMockResponse(clarificationQuestionGenerator, {
	input: {
		questionsToGenerate: 2,
		previous: [],
		inferredGoal: "MOCK_INFERRED_GOAL",
		uncertainties: ["MOCK_UNCERTAINTY_1", "MOCK_UNCERTAINTY_2"],
	},
	response: {
		questions: [
			{
				type: "yes_no",
				purpose: "MOCK_PURPOSE_1",
				text: "MOCK_QUESTION_1",
			},
			{
				type: "yes_no",
				purpose: "MOCK_PURPOSE_2",
				text: "MOCK_QUESTION_2",
			},
		],
	},
});
registerMockResponse(generateIdealCourseDescriptor, {
	response: {
		name: "MOCK_COURSE_NAME",
		description: "MOCK_COURSE_DESCRIPTION",
		topics: ["MOCK_TOPIC_1", "MOCK_TOPIC_2"],
	},
});
registerMockResponse(courseSelectionEvaluator, {
	response: {
		decision: "ask_more_questions",
		uncertantiesRemaining: ["MOCK_UNCERTAINTY_1", "MOCK_UNCERTAINTY_2"],
	},
});

import { jsonStringify } from "@pantha/shared";
import type z from "zod";
import type { AiClient } from "../../../lib/ai/client";
import clarificationQuestionGenerator from "../../../lib/ai/tasks/clarificationQuestionGenerator";
import courseSelectionEvaluator from "../../../lib/ai/tasks/courseSelectionEvaluator";
import generateChapterPagesLegacy from "../../../lib/ai/tasks/generateChapterPages.legacy";
import generateIdealCourseDescriptor from "../../../lib/ai/tasks/generateIdealCourseDescriptor";
import generateNewCourseSkeleton from "../../../lib/ai/tasks/generateNewCourseSkeleton";
import intentClarification from "../../../lib/ai/tasks/intentClarification";
import learningIntentSummarizer from "../../../lib/ai/tasks/learningIntentSummarizer";

export const testAiAdapter: AiClient = {
	llm: {
		text: async () => {
			const response = "MOCK_RESPONSE";
			await sleep(50);
			return response;
		},
		json: async (args) => {
			const response = getMockLlmResponse(args.outputSchema, args.input);
			await sleep(50);
			return response;
		},
	},
	embedding: {
		text: async () => {
			return new Array(768).fill(0).map(() => Math.random());
		},
	},
	translation: {
		generate: async () => {
			return "MOCK_TRANSLATION";
		},
	},
	image: {
		generate: async () => {
			await sleep(50);
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
		throw new Error(
			`No mock response registered for schema: ${jsonStringify(outputSchema)}`,
		);
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
		inferredGoal: "MOCK_INFERRED_GOAL",
		uncertainties: ["MOCK_UNCERTAINTY_1", "MOCK_UNCERTAINTY_2"],
		previous: [],
		questionsToGenerate: 3,
		courses: [],
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
			{
				type: "yes_no",
				purpose: "MOCK_PURPOSE_3",
				text: "MOCK_QUESTION_3",
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
	input: {
		previous: [],
		currentCandidateCourses: [],
		questionBudgetRemaining: 20,
		questionsAsked: 0,
		remainingUncertainties: ["MOCK_UNCERTAINTY_1", "MOCK_UNCERTAINTY_2"],
	},
	response: {
		decision: "ask_more_questions",
		uncertantiesRemaining: ["MOCK_UNCERTAINTY_1", "MOCK_UNCERTAINTY_2"],
	},
});
registerMockResponse(courseSelectionEvaluator, {
	response: {
		decision: "create_new_course",
		courseGenerationInstructions: {
			assumedPrerequisites: ["MOCK_PREREQUISITE_1", "MOCK_PREREQUISITE_2"],
			constraints: {
				focus: "MOCK_FOCUS",
				granularity: "MOCK_GRANULARITY",
				minimumChapters: 50,
			},
			courseDescription: "MOCK_COURSE_DESCRIPTION",
			courseTitle: "MOCK_COURSE_TITLE",
			targetAudience: "MOCK_TARGET_AUDIENCE",
		},
	},
});
registerMockResponse(generateNewCourseSkeleton, {
	response: {
		overview: {
			title: "MOCK_COURSE_TITLE",
			description: "MOCK_COURSE_DESCRIPTION",
			topics: ["MOCK_TOPIC_1", "MOCK_TOPIC_2"],
			icon: "MOCK_ICON",
			chapters: [
				{
					title: "MOCK_CHAPTER_TITLE",
					description: "MOCK_CHAPTER_DESCRIPTION",
					topics: ["MOCK_TOPIC_1", "MOCK_TOPIC_2"],
					icon: "MOCK_ICON",
					intent: "introduce",
				},
			],
		},
	},
});
export const testChapterGenerationPages = [
	{
		type: "example_uses",
		content: {
			topic: "MOCK_TOPIC",
			text: "MOCK_EXAMPLE_TEXT",
			examples: ["MOCK_EXAMPLE_1", "MOCK_EXAMPLE_2"],
		},
	},
	{
		type: "quiz",
		content: {
			question: "MOCK_QUESTION",
			options: ["MOCK_OPTION_1", "MOCK_OPTION_2", "MOCK_OPTION_3"],
			correctOptionIndex: 1,
		},
	},
	{
		type: "teach_and_explain_content",
		content: {
			topic: "MOCK_TOPIC",
			markdown: "MOCK_MARKDOWN_CONTENT",
		},
	},
	{
		type: "true_false",
		content: {
			statement: "MOCK_STATEMENT",
			isTrue: true,
		},
	},
	{
		type: "identify_shown_object_in_image",
		content: {
			image: { prompt: "MOCK_PROMPT" },
			options: ["MOCK_OPTION_1", "MOCK_OPTION_2", "MOCK_OPTION_3"],
			correctOptionIndex: 1,
		},
	},
	{
		type: "matching",
		content: {
			pairs: [
				{ left: "MOCK_LEFT_1", right: "MOCK_RIGHT_1" },
				{ left: "MOCK_LEFT_2", right: "MOCK_RIGHT_2" },
			],
		},
	},
	{
		type: "identify_object_from_images",
		content: {
			object: "MOCK_OBJECT",
			images: [{ prompt: "MOCK_PROMPT_1" }, { prompt: "MOCK_PROMPT_2" }],
			correctImageIndex: 1,
		},
	},
] satisfies z.infer<typeof generateChapterPagesLegacy.outputSchema>["pages"];
registerMockResponse(generateChapterPagesLegacy, {
	response: {
		pages: testChapterGenerationPages,
	},
});

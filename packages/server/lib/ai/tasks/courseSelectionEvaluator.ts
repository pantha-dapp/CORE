import z from "zod";

const courseSelectionEvaluatorPrompt = `You are a course-selection decision engine in a mobile learning platform.

In this platform:
- A "course" is a structured learning path defined by chapters and concepts.
- Many courses already exist and should be reused WHEN possible.
- Creating new courses is expensive and should be avoided unless necessary.

Your task is to decide what the system should do next
based on the user's clarified learning intent and
a small set of candidate existing courses.

You do NOT generate course content, chapters, or lessons.

You must choose exactly ONE action:
1) ask_more_questions
   - Use this when the user's intent is still ambiguous
   - Or when more information would help decide between existing courses

2) select_existing_course
   - Use this when one existing course clearly matches the user's intent
   - Prefer reuse over creation whenever reasonable

3) create_new_course
   - Use this ONLY when no existing course fits the user's intent
   - This is a last resort

Decision priorities (most important first):
ask_more_questions > select_existing_course > create_new_course

Be conservative.
Avoid unnecessary questions, but avoid unnecessary new courses even more.

You may ONLY use the information provided in the input.
Do NOT assume missing details.

Output JSON only.

If confidence is below 0.7, prefer ask_more_questions but also consider the budget.

output uncertantiesRemaining and questionCount if and only if decision is ask_more_questions,

output chosenCourseId if and only if decision is select_existing_course,

output courseGenerationInstructions if and only if decision is create_new_course.
`;

const courseSelectionEvaluatorInputSchema = z.object({
	// currentIntentSummary: z.string(),
	previous: z.array(
		z.object({
			question: z.string(),
			purpose: z.string(),
			answer: z.string(),
		}),
	),
	remainingUncertainties: z.array(z.string()),
	currentCandidateCourses: z.array(
		z.object({
			id: z.number(),
			title: z.string(),
			description: z.string(),
			topics: z.array(z.string()),
		}),
	),
	questionsAsked: z.number(),
	questionBudgetRemaining: z.number(),
});

const courseSelectionEvaluatorOutputSchema = z.object({
	decision: z.enum([
		"ask_more_questions",
		"select_existing_course",
		"create_new_course",
	]),

	uncertantiesRemaining: z.array(z.string()).optional().nullable(),
	questionCount: z.number().optional().nullable(),

	chosenCourseId: z.number().optional().nullable(),

	courseGenerationInstructions: z
		.object({
			courseTitle: z.string(),
			courseDescription: z.string(),
			targetAudience: z.string(),
			assumedPrerequisites: z.array(z.string()),
			constraints: z.object({
				minimumChapters: z.number().min(30),
				granularity: z.string(),
				focus: z.string(),
			}),
		})
		.optional()
		.nullable(),
});

export default {
	inputSchema: courseSelectionEvaluatorInputSchema,
	outputSchema: courseSelectionEvaluatorOutputSchema,
	prompt: courseSelectionEvaluatorPrompt,
};

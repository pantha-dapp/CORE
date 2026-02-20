import z from "zod";

const generateNewCourseSkeletonPrompt = `You are a course-structure generator for a mobile learning platform.

In this platform:
- A course is a long, structured learning path composed of many small chapters.
- Each chapter represents a single, focused learning unit.
- Chapters must be granular enough to be taught in short, interactive sessions.

Your task is to generate a COMPLETE course skeleton.

Rules (STRICT):
- You MUST generate AT LEAST 50 chapters.
- Chapters must be ordered from foundational to advanced.
- Chapters must increase in difficulty gradually.
- Chapters must be concept-focused, not lesson-focused.
- Do NOT generate lesson content, explanations, questions, or examples.
- Do NOT use vague chapter titles like "Advanced Topics".
- Do NOT bundle multiple unrelated ideas into one chapter.

CRITICAL - EVERY SINGLE CHAPTER MUST HAVE ALL 4 REQUIRED FIELDS:
1. "title" (string): Clear, specific chapter title
2. "description" (string): Detailed explanation of what the learner will understand or be able to do (minimum 15 words)
3. "topics" (array): List of 3-5 concrete sub-concepts covered (must have at least 2 items)
4. "intent" (string): Must be EXACTLY one of these values: "introduce", "recall", "apply", "reinforce", "check_confidence"
5. "icon" (string): A simple keyword representing an icon that visually captures the chapter's main theme (e.g., "Python language", "Network Switch", "Musical Note")

VALIDATION RULES:
- Missing ANY field in ANY chapter will cause complete failure
- Empty arrays or empty strings are NOT allowed
- "intent" must match one of the 5 allowed values exactly (case-sensitive)
- Descriptions must be substantive enough for automated content generation

Descriptions MUST be detailed enough that:
- Another system can generate quizzes, diagrams, and interactive steps from them
- The scope of the chapter is unambiguous
- A learner can understand the specific learning outcome

Icons must be generic and not specific / chapter content related. They are only for visual representation so use generic words and reuse them whenever possible, we dont want too many icons.

Output ONLY valid JSON matching the schema.
Do NOT include commentary, explanations, or markdown formatting.
`;

const generateNewCourseSkeletonInputSchema = z.object({
	courseTitle: z.string(),
	courseDescription: z.string(),
	targetAudience: z.string(),
	assumedPrerequisites: z.array(z.string()),
	constraints: z.object({
		minimumChapters: z.number().default(50),
		granularity: z.string(),
		focus: z.string(),
	}),
});

const generateNewCourseSkeletonOutputSchema = z.object({
	overview: z.object({
		title: z.string(),
		description: z.string(),
		topics: z.array(z.string()),
		icon: z.string(),
		chapters: z.array(
			z.object({
				title: z.string(),
				description: z.string(),
				topics: z.array(z.string()),
				icon: z.string(),
				intent: z.enum([
					"introduce",
					"recall",
					"apply",
					"reinforce",
					"check_confidence",
				]),
			}),
		),
	}),
});

export default {
	inputSchema: generateNewCourseSkeletonInputSchema,
	outputSchema: generateNewCourseSkeletonOutputSchema,
	prompt: generateNewCourseSkeletonPrompt,
};

import z from "zod";

const generateSimilarCoursePrompt = `You are a course discovery system that generates alternative learning paths after a user completes a course.

Your task is to generate N similar courses that:
1. Match the difficulty level and depth of the original course
2. Build on complementary or related skills
3. Do NOT repeat the exact topics from the original course
4. Represent natural "next steps" or alternative specializations in the same domain
5. Appeal to someone who just completed the target course

Example progressions:
- After "Python Basics" → suggest "JavaScript for Web Development", "Data Analysis with Python", "Backend API Development"
- After "Networking Fundamentals" → suggest "Cybersecurity Basics", "Routing & Switching", "Network Administration"
- After "HTML & CSS" → suggest "JavaScript Interactivity", "React for Frontend Development", "UI/UX Design Principles"

CRITICAL RULES:
- EVERY COURSE MUST HAVE ALL REQUIRED FIELDS:
  1. "title" (string): Clear, specific course name that shows progression/alternative
  2. "description" (string): Explain what this course covers and why it's a good next step (minimum 25 words)
  3. "topics" (array): 5-10 key topic areas covered (must have at least 5 items, do not duplicate original course topics)
  4. "chapters" (array): MUST include AT LEAST 50 chapters

- EVERY CHAPTER MUST HAVE:
  1. "title" (string): Specific, concept-focused chapter title
  2. "description" (string): Detailed explanation of what learner will understand (minimum 15 words)
  3. "topics" (array): 3-5 concrete sub-concepts (minimum 2 items)
  4. "intent" (string): EXACTLY one of: "introduce", "recall", "apply", "reinforce", "check_confidence"
  5. "icon" (string): Generic keyword for visual representation (reuse common icons like: "code", "data", "network", "security", "design", "book", "tool", "test", "rocket", "brain")

GENERATION RULES:
- Chapters must progress from foundational to advanced
- Do not bundle multiple unrelated concepts into one chapter
- No vague titles like "Advanced Topics"
- Icons should be generic and reused across chapters
- Difficulty should match the original course (if original has 50 chapters, similar courses should also have 50+)

Validation requirements:
- Missing ANY field in ANY chapter causes complete failure
- No empty arrays or empty strings
- "intent" must be exact case-sensitive match
- Descriptions must be substantive enough for automated content generation

Output ONLY valid JSON matching the schema. Do NOT include commentary, explanations, or markdown formatting.`;

const generateSimilarCourseInputSchema = z.object({
	targetCourse: z.object({
		title: z.string(),
		description: z.string(),
		topics: z.array(z.string()),
		icon: z.string().optional(),
	}),
	coursesCount: z.number().int().min(1).max(10).default(3),
});

const generateSimilarCourseOutputSchema = z.object({
	similarCourses: z.array(
		z.object({
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
	),
});

export default {
	inputSchema: generateSimilarCourseInputSchema,
	outputSchema: generateSimilarCourseOutputSchema,
	prompt: generateSimilarCoursePrompt,
};

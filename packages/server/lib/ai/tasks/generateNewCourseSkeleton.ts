import z from "zod";
import { createAiGenerateFunction } from "../engine";

const generateNewCourseSkeletonPrompt = `You are a course-structure generator for a mobile learning platform.

In this platform:
- A course is a long, structured learning path composed of many small chapters.
- Each chapter represents a single, focused learning unit.
- Chapters must be granular enough to be taught in short, interactive sessions.

Your task is to generate a COMPLETE course skeleton.

Rules (STRICT):
- You MUST generate AT LEAST 200 chapters.
- Chapters must be ordered from foundational to advanced.
- Chapters must increase in difficulty gradually.
- Chapters must be concept-focused, not lesson-focused.
- Do NOT generate lesson content, explanations, questions, or examples.
- Do NOT use vague chapter titles like "Advanced Topics".
- Do NOT bundle multiple unrelated ideas into one chapter.

Each chapter MUST include:
- A clear, specific title
- A detailed description explaining what the learner will understand or be able to do after completing the chapter
- A list of concrete topics or sub-concepts covered in that chapter

Descriptions MUST be detailed enough that:
- Another system can generate quizzes, diagrams, and interactive steps from them
- The scope of the chapter is unambiguous

Output JSON only.
Do NOT include commentary or explanations.

Example Output:
{
  "overview": [
    {
      "title": "Introduction to Python Automation",
      "description": "This chapter introduces the concept of automation using Python, covering basic scripting techniques and common use cases.",
      "topics": ["Python scripting basics", "Automation use cases"],
      "chapters": [
        {
          "title": "Setting Up Your Python Environment",
          "description": "Learn how to install Python, set up a virtual environment, and manage packages using pip.",
          "topics": [
            "Installing Python",
            "Creating virtual environments",
            "Using pip for package management"
          ]
        },
]    }`;

const generateNewCourseSkeletonInputSchema = z.object({
	courseTitle: z.string(),
	courseDescription: z.string(),
	targetAudience: z.string(),
	assumedPrerequisites: z.array(z.string()),
	constraints: z.object({
		minimumChapters: z.number().default(200),
		granularity: z.string(),
		focus: z.string(),
	}),
});

const generateNewCourseSkeletonOutputSchema = z.object({
	overview: z.object({
		title: z.string(),
		description: z.string(),
		topics: z.array(z.string()),
		chapters: z.array(
			z.object({
				title: z.string(),
				description: z.string(),
				topics: z.array(z.string()),
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

export const generateNewCourseSkeleton = createAiGenerateFunction(
	{
		input: generateNewCourseSkeletonInputSchema,
		output: generateNewCourseSkeletonOutputSchema,
	},
	generateNewCourseSkeletonPrompt,
);

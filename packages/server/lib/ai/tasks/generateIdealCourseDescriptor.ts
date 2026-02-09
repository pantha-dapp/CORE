import z from "zod";
import { createAiGenerateFunction } from "../engine";

const generateIdealCourseDescriptorPrompt = `You generate a descriptor of an ideal course that would match a user's learning intent.

This descriptor will be used for semantic similarity matching against existing courses.

Your task:
- Generate a course name that captures the essence of what the user wants to learn
- Write a detailed description (2-3 sentences) of what such a course would cover
- List 5-10 key topics/concepts that would be included
- Learning Intent is the user's expressed desire to learn something specific
- Inferred Goal is a concise summary of what the user aims to achieve based on their intent
- Previous Q&A provides context on the user's interests and helps clarify their needs, these have been answered by the user

Rules:
- Be specific based on the inferred goal
- Include the major category context
- If there are uncertainties, make reasonable assumptions for a general course
- Use clear, searchable terminology
- Focus on what makes this course unique

Output JSON only.

Example Input:
{
  "majorCategory": "Computer Science",
  "learningIntent": "I want to learn how to use Python to automate repetitive tasks",
  "inferredGoal": "Learning Python for automating tasks",
  "previous": [
    {
      "question": "What is your major area of interest?",
      "purpose": "To understand the general field the user wants to explore",
      "answer": "Computer Science"
    },
    {
      "question": "What specific skills or topics are you interested in?",
      "purpose": "To narrow down the focus within the major category",
      "answer": "Using Python for automation"
    }
  ],
  "uncertainties": ["What kind of automation?"]
}

Example Output:
{
  "name": "Python Task Automation",
  "description": "A practical course on using Python to automate repetitive tasks, file operations, and system workflows. Covers scripting fundamentals, working with files and APIs, and building automation tools.",
  "topics": [
    "Python scripting basics",
    "File system operations",
    "Working with APIs",
    "Task scheduling",
    "Data processing automation",
    "Web scraping",
    "Email automation"
  ]
}
`;

const generateIdealCourseDescriptorInputSchema = z.object({
	majorCategory: z.string(),
	learningIntent: z.string(),
	inferredGoal: z.string(),
	previous: z.array(
		z.object({
			question: z.string(),
			purpose: z.string(),
			answer: z.string(),
		}),
	),
	uncertainties: z.array(z.string()),
});

const generateIdealCourseDescriptorOutputSchema = z.object({
	name: z.string(),
	description: z.string(),
	topics: z.array(z.string()),
});

export default {
	inputSchema: generateIdealCourseDescriptorInputSchema,
	outputSchema: generateIdealCourseDescriptorOutputSchema,
	prompt: generateIdealCourseDescriptorPrompt,
};

import z from "zod";
import { createAiGenerateFunction } from "../engine";

const generateIdealCourseDescriptorPrompt = `You generate a descriptor of an ideal course that would match a user's learning intent.

This descriptor will be used for semantic similarity matching against existing courses.

Your task:
- Generate a course name that captures the essence of what the user wants to learn
- Write a detailed description (2-3 sentences) of what such a course would cover
- List 5-10 key topics/concepts that would be included

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
  "inferredGoal": "Learning Python for automating tasks",
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
	inferredGoal: z.string(),
	uncertainties: z.array(z.string()),
});

const generateIdealCourseDescriptorOutputSchema = z.object({
	name: z.string(),
	description: z.string(),
	topics: z.array(z.string()),
});

export const generateIdealCourseDescriptor = createAiGenerateFunction(
	{
		input: generateIdealCourseDescriptorInputSchema,
		output: generateIdealCourseDescriptorOutputSchema,
	},
	generateIdealCourseDescriptorPrompt,
);

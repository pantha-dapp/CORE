import z from "zod";
import { createAiGenerateFunction } from "../engine";

const intentClarificationPrompt = `You are an intent clarification engine for a learning platform.
Your job is NOT to generate courses or lessons.

Your job is to:
1. Interpret what the user likely wants to learn
2. Identify ambiguities or missing scope
3. Decide what needs clarification via short questions

Rules:
- Do NOT assume advanced or beginner level
- Do NOT invent constraints not stated
- Be conservative in interpretation
- Prefer asking clarifying questions over guessing
- Output JSON only

Example Input:
{
  "majorCategory": "Computer Science",
  "userInput": "python automation"
}
Example Output:
{
  "inferredGoal": "Learning Python for automating tasks",
  "uncertainties": [
    "What kind of automation (files, web, DevOps, testing)?"
  ]
}
`;

const intentClarificationInputSchema = z.object({
	majorCategory: z.string(),
	userInput: z.string(),
});

const intentClarificationOutputSchema = z.object({
	inferredGoal: z.string(),
	uncertainties: z.array(z.string()),
});

export default {
	inputSchema: intentClarificationInputSchema,
	outputSchema: intentClarificationOutputSchema,
	prompt: intentClarificationPrompt,
};

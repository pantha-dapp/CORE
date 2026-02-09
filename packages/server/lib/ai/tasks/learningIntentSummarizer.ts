import z from "zod";
import { createAiGenerateFunction } from "../engine";

const learningIntentSummarizerPrompt = `You update an internal intent summary for a learning platform.

The summary is used for:
- semantic search
- course matching
- decision making

Rules:
- Keep it concise (3-6 lines max)
- Do NOT add assumptions
- Only include information explicitly confirmed by the user
- Prefer factual, neutral language
- Do NOT remove previously confirmed information
- Do NOT mention uncertainty unless it remains unresolved

Output JSON only.

Example Output:
{
  "summary": "A concise summary of the user's learning intent based on confirmed information."
}
`;

const learningIntentSummarizerInputSchema = z.object({
	majorCategory: z.string(),
	userInput: z.string(),
	clarificationQA: z.array(
		z.object({
			question: z.string(),
			purpose: z.string(),
			answer: z.string(),
		}),
	),
});

const learningIntentSummarizerOutputSchema = z.object({
	summary: z.string(),
});

export default {
	inputSchema: learningIntentSummarizerInputSchema,
	outputSchema: learningIntentSummarizerOutputSchema,
	prompt: learningIntentSummarizerPrompt,
};

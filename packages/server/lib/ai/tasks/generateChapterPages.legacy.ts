import z from "zod";
import {
	generateChapterPageOutputFlatSchema,
	pageContentSchemas,
} from "./generateChapterPage.schemas";

const generateChapterPagesPrompt = `You are an expert micro-learning content designer (Duolingo-style). Generate complete, ready-to-use interactive pages for a single chapter. Every page = 10-30 seconds of engagement. Dopamine-triggering, gamified, concise.

CHAPTER INTENT (teaching/question ratio):
• "introduce": 60/40. Flow: definition → example → basic test → application.
• "recall": 30/70. Open with a question to activate memory, brief refresher, heavy testing.
• "apply": 20/80. Minimal teaching, scenario-based questions, real-world applications.
• "reinforce": 50/50. Use new analogies, address misconceptions, target weak spots.
• "check_confidence": 10/90. Almost pure testing; warm-up → comprehensive → synthesis.

RULES:
- Cover ALL topics in chapter.topics
- Vary page types: never same type >2 times in a row; no >2 teach pages or >3 question pages in a row
- Test within 1-2 pages after teaching
- Progressive difficulty: easy → hard; final page = challenging synthesis question
- Never repeat the same concept or question
- Build on courseTillNowOverview — don't re-teach already-completed topics
- Images: use sparingly for abstract topics (math, code); freely for visual topics (art, architecture, UI)
- minimumPages: generate AT LEAST this many pages; up to 2-3 more if needed

PAGE TYPES (use exact type names):
1. teach_and_explain_content – One concept per page, concise markdown.
2. example_uses – 2-4 real-world examples with short intro text. Use after teaching.
3. quiz – 3-4 choices, one correct (correctOptionIndex is 0-based).
4. true_false – Single unambiguous statement (isTrue: boolean).
5. fill_in_the_blanks – words array with $1/$2 as blanks; answers array; flat wrongOptions array.
6. matching – 3-5 {left, right} pairs.
7. identify_shown_object_in_image – 3-4 options + correctOptionIndex; requires image.prompt.
8. identify_object_from_images – object + images array (each with prompt) + correctImageIndex.

Content schema (strictly adhere to these structures):
${String(pageContentSchemas)}`;

const generateChapterPagesInputSchema = z.object({
	courseTillNowOverview: z.array(
		z.object({
			title: z.string(),
			description: z.string(),
			topics: z.array(z.string()),
		}),
	),
	chapterNo: z.number(),
	chapter: z.object({
		overview: z.object({
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
	}),
	minimumPages: z.number().default(10),
});

const generateChapterPagesOutputSchema = z.object({
	pages: z.array(generateChapterPageOutputFlatSchema),
});

export default {
	inputSchema: generateChapterPagesInputSchema,
	outputSchema: generateChapterPagesOutputSchema,
	prompt: generateChapterPagesPrompt,
};

import z from "zod";
import {
	generateChapterPageOutputFlatSchema,
	pageContentSchemas,
} from "./generateChapterPage.schemas";

const generateChapterPagesPrompt = `You are an expert learning experience designer for a mobile micro-learning platform like Duolingo.

Your task: Design AND generate complete, ready-to-use interactive "pages" for a single chapter, where each page builds on the previous ones.

You will both plan the learning flow AND create the actual content — this is a one-shot generation, so make it comprehensive and high-quality.

DESIGN PRINCIPLES (Duolingo-style):

1. MICRO-LEARNING: Each page = 10-30 seconds of engagement
2. PROGRESSIVE DISCLOSURE: Introduce one concept at a time, layer complexity gradually
3. IMMEDIATE REINFORCEMENT: Test concepts right after teaching them
4. VARIED INTERACTION: Mix question types to maintain engagement
5. CONFIDENCE BUILDING: Easy → Medium → Challenging progression within chapter
6. NO REPETITION: Each page must advance learning — never repeat the same question or explanation
7. You are given previous chapters' overviews (courseTillNowOverview) to build upon, make connections relevant to them
8. chapterNo will be provided for context about the chapter's position in the course
9. Optimize for short attention spans, don't force long bookish reading sessions. Quick and dopamine triggering gamified learning experience must be preserved.

INPUT:
You receive:

1. courseTillNowOverview: Chapters the user has ALREADY completed
   - Assume mastery of these concepts though occasional refreshers are okay
   - Build upon (don't re-explain) this foundation
   - Make explicit connections when relevant

2. chapter: Current chapter details
   - title: Main topic
   - description: Learning outcome
   - topics: Sub-concepts to cover (MUST cover ALL)
   - intent: Pedagogical approach (see below)

3. minimumPages: Target number of pages

4. chapterNo: Position of chapter in course (for context, not content)

CHAPTER INTENT (strict adherence required):

• "introduce" - First exposure to concept
  → Start with foundational teaching pages
  → Use simple, concrete examples before abstractions
  → Gentle questions to check basic comprehension
  → Ratio: 60% teaching, 40% questions
  → Build: Simple definition → Concrete example → Basic test → Application

• "recall" - User learned before, bring back to memory
  → OPEN with a question to activate prior knowledge
  → Brief refresher only if needed (2-3 pages max)
  → Heavy testing to verify retention
  → Ratio: 30% teaching, 70% questions
  → Build: Memory jog question → Quick refresher → Increasingly harder tests

• "apply" - User knows theory, practice application
  → Minimal or zero teaching
  → Scenario-based questions with real-world contexts
  → Multiple examples showing different applications
  → Ratio: 20% teaching, 80% application/examples
  → Build: Quick context → Application scenario → Harder application → Edge case

• "reinforce" - User struggles, strengthen understanding
  → Re-teach using DIFFERENT explanations/analogies than before
  → Address common misconceptions explicitly
  → Questions targeting weak spots
  → Ratio: 50% teaching, 50% targeted questions
  → Build: New angle teaching → Misconception question → Alternative explanation → Mastery check

• "check_confidence" - Quick assessment before advancing
  → Almost pure testing
  → Questions should feel achievable if user knows material
  → Cover all key concepts from chapter
  → Ratio: 10% teaching, 90% questions
  → Build: Warm-up question → Comprehensive testing → Synthesis question

PACING & FLOW RULES (CRITICAL):

✓ MUST cover ALL topics listed in chapter.topics - distribute evenly
✓ MUST vary page types - never use same type more than 2 times consecutively
✓ MUST test concepts immediately after teaching (within 1-2 pages)
✓ MUST increase difficulty gradually: easy → medium → hard
✓ MUST end with a challenging synthesis question for accomplishment
✓ MUST create logical flow: teach → example → test → apply → harder test
✓ NEVER repeat the same concept explanation
✓ NEVER ask the same question twice (even with different wording)
✓ NEVER teach without testing shortly after
✓ NEVER test before teaching (except "recall" intent)
✓ NO more than 2 teaching pages in a row
✓ NO more than 3 question pages in a row
✓ May optionally have an image prompt if relevant and required but this is not mandatory, avoid unnecessary images as image generation is costly and time-consuming, use images sparingly but do use them.

PAGE TYPES & CONTENT SPECIFICATIONS:

1. teach_and_explain_content - Introduce or explain a concept
   STRUCTURE:
   - topic: Clear title of what's being taught (e.g., "What is a Variable?")
   - markdown: Educational content in markdown format

   GUIDELINES:
   - Keep content concise: 3-6 short paragraphs maximum
   - Use conversational, accessible language
   - Use **bold** for emphasis on key terms
   - Use bullet points for lists or key points
   - Include code examples in \`\`\` blocks when relevant
   - Use analogies to make abstract concepts concrete
   - Focus on ONE concept per page
   - Avoid walls of text - break into digestible chunks

2. example_uses - Real-world applications (use AFTER teaching)
   STRUCTURE:
   - topic: A clear title for what examples you're showing
   - text: 1-2 sentences introducing why these examples matter
   - examples: Array of 2-4 concrete, relatable examples

   GUIDELINES:
   - Each example should be short (one sentence or phrase)
   - Make examples memorable and practical
   - Connect to real-world scenarios learners can relate to
   - Keep examples diverse to show range of applications

3. quiz - Multiple choice (use for concept testing)
   STRUCTURE:
   - question: Clear, unambiguous question testing one specific concept
   - options: Array of 3-4 answer choices (only ONE correct)
   - correctOptionIndex: Zero-based index of the correct answer

   GUIDELINES:
   - Question should test understanding, not memorization
   - Correct answer must be definitively right
   - Use common misconceptions as distractors when possible
   - Avoid trick questions or ambiguous wording
   - Keep all options roughly the same length
   - Don't use "all of the above" or "none of the above"

4. true_false - Quick fact checks (use for simple verifications)
   STRUCTURE:
   - statement: A declarative sentence that is definitively true or false
   - isTrue: Boolean indicating if the statement is true

   GUIDELINES:
   - Statement must be unambiguously true or false
   - Avoid tricky wording or double negatives
   - Good for reinforcing key facts immediately after teaching

5. fill_in_the_blanks - Terminology reinforcement (use AFTER introducing terms)
   STRUCTURE:
   - words: Complete array where blanks are $1, $2, etc.
   - answers: Array of correct words for the blanks in order
   - wrongOptions: Array of incorrect options as distractors

   GUIDELINES:
   - Write complete, grammatically correct sentence first
   - Choose 1-2 key terms to make blank (max 2 blanks)
   - Missing words should be guessable from context
   - Must have at least 2 wrong options per question
   - Distractors should be plausible but clearly wrong

6. matching - Connect related items (use for relationships/associations)
   STRUCTURE:
   - pairs: Array of 3-5 objects with "left" and "right" strings

   GUIDELINES:
   - All pairs from same category/topic
   - Matches should be unambiguous
   - Good for: term↔definition, cause↔effect, concept↔example

7. identify_shown_object_in_image - Visual identification
   STRUCTURE:
   - options: Array of 3-4 possible identifications
   - correctOptionIndex: Zero-based index of correct answer

   GUIDELINES:
   - Only use when visual identification adds value
   - Options should be distinct concepts that could be confused
   - Good for: code patterns, UI elements, diagrams, data structures

8. identify_object_from_images - Choose correct image
   STRUCTURE:
   - object: What learner should find/identify
   - images: Array of image prompt objects describing each image
   - correctImageIndex: Zero-based index of image containing object

   GUIDELINES:
   - Use when comparing visual elements is educational
   - Generate 3-4 image prompts showing similar but different things
   - Keep prompts clear and focused on educational content

CONTENT QUALITY STANDARDS:

✓ SPECIFIC & CONCRETE: Every piece of content should be precise
  Bad Quiz: "What is a function?"
  Good Quiz: "What happens when you call a function with parameters in Python?"

✓ PROGRESSIVE DIFFICULTY: Start simple, build to complex
  Easy → Can identify concept
  Medium → Can apply concept in familiar context
  Hard → Can apply in novel situations or combine concepts

✓ EDUCATIONAL VALUE: Every page should teach or reinforce something
  - Questions should reveal understanding gaps, not test trivia
  - Explanations should clarify, not confuse
  - Examples should illuminate, not obscure

✓ CONTEXTUAL COHERENCE: Pages should flow naturally
  - Reference previous concepts when building on them
  - Use consistent terminology throughout
  - Maintain narrative thread across pages

✓ ENGAGEMENT: Keep learner motivated
  - Celebrate progress with achievable challenges
  - Vary interaction patterns to prevent monotony
  - End on a high note with satisfying synthesis

ANTI-PATTERNS (avoid these):

✗ Vague content: "Functions are useful"
✓ Specific content: "Functions let you reuse code. Instead of writing print('Hello') 10 times, write a function once and call it 10 times"

✗ Repetitive sequence: teach → quiz → teach → quiz
✓ Varied sequence: teach → example → quiz → true_false → teach → matching

✗ Testing before teaching: quiz on unseen topic
✓ Proper sequencing: teach first, then test

✗ Identical questions: Same concept tested twice identically
✓ Progressive questions: Definition → Usage → Application → Edge case

✗ Long/Boring/Theoretical text: Long boring deep dives without clear examples or applications
✓ Gamified Dopamine trigerring text: 'example_uses', 'teach_and_explain_content' etc is small and optimized for short attention spans

OUTPUT 'CONTENT' field format MUST strictly adhere to the following JSON schema, where "type" determines the structure of "content". Ensure all content is complete, specific, and ready-to-use as-is.:
${String(pageContentSchemas)}

OUTPUT FORMAT:
{
  "pages": [
    {
      "type": "teach_and_explain_content",
      "image" : {prompt: ""},
      "content": {
        "topic": "...",
        "markdown": "..."
      }
    },
    {
      "type": "quiz",
      "content": {
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correctOptionIndex": 0
      }
    },
    {
      "type": "example_uses",
      "content": {
        "topic": "...",
        "text": "...",
        "examples": ["...", "...", "..."]
      }
    }
    // ... more pages
  ]
}

QUALITY CHECKLIST (verify before outputting):
□ All topics from chapter.topics are covered
□ No two consecutive pages teach/test exact same concept
□ Teaching pages are followed by questions within 1-2 pages
□ Difficulty progresses from easy to hard
□ Page types are varied (not 3+ of same type in a row)
□ Each page has complete, specific, ready-to-use content
□ Intent-appropriate teaching/question ratio is maintained
□ Final page is a challenging synthesis question
□ All content is educational, engaging, and accurate
□ Pages flow naturally with logical progression`;

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

// export const generateChapterPages = async (
// 	args: Parameters<typeof generateChapterPagesRaw>[0],
// ) => {
// 	const result = await generateChapterPagesRaw(args);

// 	const parsed = generateChapterPageOutputTypedSchema
// 		.array()
// 		.safeParse(result.pages);

// 	if (!parsed.success) {
// 		console.error("Failed to validate generated pages", {
// 			error: String(parsed.error).slice(0, 255),
// 			result: jsonStringify(result),
// 		});
// 		throw new Error("Failed to validate generated pages");
// 	}

// 	return {
// 		pages: parsed.data,
// 	};
// };

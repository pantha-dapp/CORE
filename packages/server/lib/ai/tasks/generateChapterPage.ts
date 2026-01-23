import z from "zod";
import { createAiGenerateFunction } from "../engine";

const generateChapterPagesPrompt = `You are a content generator for a mobile micro-learning platform similar to Duolingo.

Your task is to generate a sequence of interactive "pages" for a single chapter.
Each page is a bite-sized learning moment — a quick read, a question, or an interactive exercise.

The user will swipe through these pages on their phone.
Your goal is to make learning feel effortless, engaging, and rewarding.

INPUT:
You receive:

1. courseTillNowOverview: An array of ALL chapters the user has ALREADY completed.
   - Use this to understand what the learner already knows
   - You can reference these concepts without re-explaining them
   - You can build upon this foundation
   - You can create connections to previously learned material

2. chapter: The current chapter to generate content for, containing:
   - title: The chapter's main topic
   - description: What the learner should understand after completing
   - topics: Specific sub-concepts to cover
   - intent: The pedagogical purpose of this chapter (CRITICAL - see below)

3. minimumPages: Minimum number of pages to generate

CHAPTER INTENT (adapt your content style based on this):

- "introduce": First time teaching this concept. Explain from scratch, assume no prior knowledge of THIS topic (but leverage courseTillNowOverview for prerequisites). Focus on teaching pages, gentle questions.

- "recall": User learned this before, bring it back to memory. Start with a question to jog memory, then briefly refresh the concept, then test. More questions than teaching. Reference: "Remember when we learned about X?"

- "apply": User knows the theory, now practice using it. Minimal teaching, heavy on scenarios, examples, and application-based questions. "Now let's use what you learned about X to..."

- "reinforce": User is shaky on this, strengthen understanding. Mix of re-teaching with different angles/analogies + targeted questions on common mistakes. Address misconceptions.

- "check_confidence": Quick assessment chapter. Mostly questions with minimal teaching. Used to verify mastery before moving on. If they know it, it should feel easy and rewarding.

OUTPUT:
Generate pages according to minimumPages (default 10-15).
Pages should flow naturally, with teaching/testing ratio based on intent.

PAGE TYPES (use variety):

1. "teach_and_explain_content"
   - Use for introducing new concepts
   - Keep markdown concise (3-6 short paragraphs max)
   - Use bullet points, bold text for emphasis
   - Explain ONE concept clearly, not multiple

2. "example_usages"
   - Use after introducing a concept to show real-world applications
   - Provide 2-4 concrete, relatable examples
   - Keep examples short and memorable

3. "quiz" (multiple choice)
   - Use to test understanding of a recently taught concept
   - Question should be clear and unambiguous
   - Provide 3-4 options, only ONE correct
   - Distractors should be plausible but clearly wrong to someone who understood

4. "true_false"
   - Use for quick knowledge checks
   - Statement must be definitively true or false
   - Avoid tricky wording or edge cases

5. "fill_in_the_blanks"
   - Use to reinforce key terminology or definitions
   - Sentence should make the missing word(s) guessable from context
   - missingWordIndices are 0-based word positions in the sentence

6. "matching"
   - Use to connect related concepts (term↔definition, cause↔effect)
   - Provide 3-5 pairs
   - All pairs should be from the same category/topic
   - Left items should be similar type, right items should be similar type

7. "identify_shown_object_in_image" (requires imageUrl)
   - Only use when visual identification is relevant to the topic
   - Set imageUrl to a descriptive placeholder: "[IMAGE: description of what should be shown]"

8. "identify_object_from_images" (requires imageUrls)
   - Only use when comparing visual elements is educational
   - Set imageUrls to descriptive placeholders

PACING RULES (adapt based on intent):

For "introduce":
- Start with 1-2 teaching pages to build foundation
- Follow each teaching page with 1-2 interactive pages
- Ratio: ~60% teaching, ~40% questions

For "recall":
- Start with a question to activate memory
- Brief refresher teaching, then more questions
- Ratio: ~30% teaching, ~70% questions
- Reference previous chapters explicitly

For "apply":
- Minimal teaching (only if needed for context)
- Heavy on scenario-based questions and examples
- Ratio: ~20% teaching, ~80% questions/examples

For "reinforce":
- Re-teach using NEW analogies or explanations
- Target common misconceptions in questions
- Ratio: ~50% teaching, ~50% questions

For "check_confidence":
- Almost all questions, minimal teaching
- Questions should feel achievable if user knows material
- Ratio: ~10% teaching, ~90% questions

General pacing:
- Never have more than 2 teaching pages in a row
- Never have more than 3 question pages in a row
- End with a slightly harder question for accomplishment
- Cover ALL topics listed in the chapter

CONTENT QUALITY RULES:

- Write at a conversational, accessible level
- Avoid jargon unless teaching that jargon
- Questions should feel fair — test understanding, not memorization of obscure details
- Incorrect options should be educational (common misconceptions)
- Build complexity gradually within the chapter
- Each page should take 10-30 seconds to complete
- Make content feel polished, professional, and encouraging

USING PRIOR KNOWLEDGE (courseTillNowOverview):
- You MAY assume the user understands concepts from completed chapters
- You MAY reference them: "Like we saw with [previous topic]..."
- You MAY build analogies using prior knowledge
- You MUST NOT re-explain concepts already covered unless intent is "reinforce"
- For "recall" intent, explicitly connect to where they first learned it

FORBIDDEN:
- Do NOT generate walls of text
- Do NOT ask questions about content not yet taught in this chapter (unless from courseTillNowOverview)
- Do NOT use placeholder text like "Lorem ipsum"
- Do NOT repeat the same question type more than twice consecutively
- Do NOT include meta-commentary or explanations outside the JSON
- Do NOT ignore the chapter intent

Output JSON only.

Example Output:
{
  "pages": [
    {
      "type": "teach_and_explain_content",
      "content": {
        "topic": "What is a Variable?",
        "markdown": "A **variable** is a named container that stores data in your program.\\n\\nThink of it like a labeled box — you can put something inside, and later retrieve it using the label.\\n\\nIn Python, creating a variable is simple:\\n\\n\`\`\`python\\nname = \\"Alice\\"\\nage = 25\\n\`\`\`"
      }
    },
    {
      "type": "quiz",
      "content": {
        "question": "What does a variable do in programming?",
        "options": [
          "Stores data with a name",
          "Deletes files from your computer",
          "Connects to the internet",
          "Prints text to the screen"
        ],
        "correctOptionIndex": 0
      }
    },
    {
      "type": "true_false",
      "content": {
        "statement": "In Python, you must declare a variable's type before using it.",
        "isTrue": false
      }
    },
    {
      "type": "fill_in_the_blanks",
      "content": {
        "sentance": "A variable is a named container that stores data",
        "missingWordIndices": [4, 6]
      }
    },
    {
      "type": "example_usages",
      "content": {
        "topic": "Common Uses of Variables",
        "text": "Variables are used everywhere in programming to store and manipulate data.",
        "examples": [
          "Storing a user's name for personalized greetings",
          "Keeping track of a game score",
          "Holding the result of a calculation"
        ]
      }
    }
  ]
}
`;

const generateChapterPagesInputSchema = z.object({
	courseTillNowOverview: z.array(
		z.object({
			title: z.string(),
			description: z.string(),
			topics: z.array(z.string()),
		}),
	),
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

export const generateChapterPagesOutputSchema = z.object({
	pages: z.array(
		z
			.object({
				type: z.literal("example_usages"),
				imageUrl: z.string().optional(),
				content: z.object({
					topic: z.string(),
					text: z.string(),
					examples: z.array(z.string()),
				}),
			})
			.describe(
				"A page that introduces a topic, explains it and provides examples use cases for that thing / object.",
			)
			.or(
				z.object({
					type: z.literal("quiz"),
					imageUrl: z.string().optional(),
					content: z.object({
						question: z.string(),
						options: z.array(z.string()),
						correctOptionIndex: z.number(),
					}),
				}),
			)
			.describe(
				"A quiz page with a question, multiple options, and the index of the correct option.",
			)
			.or(
				z.object({
					type: z.literal("teach_and_explain_content"),
					imageUrl: z.string().optional(),
					content: z.object({
						topic: z.string(),
						markdown: z.string(),
					}),
				}),
			)
			.describe("A page that teaches and explains a concept in detail.")
			.or(
				z.object({
					type: z.literal("true_false"),
					imageUrl: z.string().optional(),
					content: z.object({
						statement: z.string(),
						isTrue: z.boolean(),
					}),
				}),
			)
			.describe("A true/false question page.")
			.or(
				z.object({
					type: z.literal("fill_in_the_blanks"),
					imageUrl: z.string().optional(),
					content: z.object({
						sentance: z.string(),
						missingWordIndices: z.array(z.number()),
					}),
				}),
			)
			.describe("A fill-in-the-blanks question page.")
			.or(
				z.object({
					type: z.literal("identify_shown_object_in_image"),
					imageUrl: z.string(),
					content: z.object({
						options: z.array(z.string()),
						correctOptionIndex: z.number(),
					}),
				}),
			)
			.describe(
				"An image-based question where user has to identify the shown object.",
			)
			.or(
				z.object({
					type: z.literal("matching"),
					content: z.object({
						pairs: z.array(
							z.object({
								left: z.string(),
								right: z.string(),
							}),
						),
					}),
				}),
			)
			.describe(
				"A matching type question page where all pairs are of similar topic and similar things appear on same side.",
			)
			.or(
				z.object({
					type: z.literal("identify_object_from_images"),
					content: z.object({
						object: z.string(),
						imageUrls: z.array(z.string()),
						correctImageIndex: z.number(),
					}),
				}),
			)
			.describe(
				"A question where user has to identify the correct image for the given object from multiple images.",
			),
	),
});

export const generateChapterPages = createAiGenerateFunction(
	{
		input: generateChapterPagesInputSchema,
		output: generateChapterPagesOutputSchema,
	},
	generateChapterPagesPrompt,
);

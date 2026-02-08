import type z from "zod";
import { createAiGenerateFunction } from "../engine";
import {
	type ChapterPageType,
	generatePageInputSchema,
	pageContentSchemas,
} from "./generateChapterPage.schemas";

export {
	generateChapterPageOutputTypedSchema,
	zChapterPageType,
} from "./generateChapterPage.schemas";

export const pageContentTypes = {
	example_uses: {
		schema: pageContentSchemas.example_uses,
		instructions: `Generate an "example_uses" page that shows real-world applications of a recently taught concept.

STRUCTURE:
- topic: A clear title for what examples you're showing (e.g., "Common Uses of Variables")
- text: 1-2 sentences introducing why these examples matter
- examples: Array of 2-4 concrete, relatable examples

GUIDELINES:
- Each example should be short (one sentence or phrase)
- Make examples memorable and practical
- Connect to real-world scenarios learners can relate to
- Keep examples diverse to show range of applications
- Avoid overly technical or abstract examples

EXAMPLE:
{
  "topic": "Real-World Uses of Arrays",
  "text": "Arrays store lists of related items, making them essential in everyday programming tasks.",
  "examples": [
    "Storing a shopping cart's items in an e-commerce app",
    "Keeping track of high scores in a game",
    "Managing a list of user comments on a social media post"
  ]
}`,
	},
	quiz: {
		schema: pageContentSchemas.quiz,
		instructions: `Generate a "quiz" page to test understanding of a recently taught concept.

STRUCTURE:
- question: Clear, unambiguous question testing one specific concept
- options: Array of 3-4 answer choices (only ONE correct)
- correctOptionIndex: Zero-based index of the correct answer

GUIDELINES:
- Question should be straightforward and test understanding, not memorization
- Correct answer must be definitively right
- Incorrect options (distractors) should be plausible but clearly wrong to someone who understood
- Use common misconceptions as distractors when possible
- Avoid trick questions or ambiguous wording
- Keep all options roughly the same length
- Don't use "all of the above" or "none of the above"

EXAMPLE:
{
  "question": "What is the main purpose of a for loop in programming?",
  "options": [
    "To repeat code a specific number of times",
    "To create new variables",
    "To delete files from disk",
    "To connect to a database"
  ],
  "correctOptionIndex": 0
}`,
	},
	teach_and_explain_content: {
		schema: pageContentSchemas.teach_and_explain_content,
		instructions: `Generate a "teach_and_explain_content" page that introduces or explains a concept.

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
- Build from simple to complex within the explanation
- Avoid walls of text - break into digestible chunks

EXAMPLE:
{
  "topic": "What is a Variable?",
  "markdown": "A **variable** is a named container that stores data in your program.\\n\\nThink of it like a labeled box — you can put something inside, and later retrieve it using the label.\\n\\nIn Python, creating a variable is simple:\\n\\n\`\`\`python\\nname = \\"Alice\\"\\nage = 25\\n\`\`\`\\n\\nYou can change what's in the variable anytime by assigning a new value."
}`,
	},
	true_false: {
		schema: pageContentSchemas.true_false,
		instructions: `Generate a "true_false" page for quick knowledge checks.

STRUCTURE:
- statement: A declarative sentence that is definitively true or false
- isTrue: Boolean indicating if the statement is true

GUIDELINES:
- Statement must be unambiguously true or false (no edge cases)
- Avoid tricky wording or double negatives
- Test understanding of a specific fact or concept
- Keep statements clear and concise
- Good for reinforcing key facts immediately after teaching
- Statement should be educational even if answered wrong

EXAMPLE:
{
  "statement": "In Python, variables must be declared with their type before use.",
  "isTrue": false
}`,
	},
	fill_in_the_blanks: {
		schema: pageContentSchemas.fill_in_the_blanks,
		instructions: `Generate a "fill_in_the_blanks" page to reinforce key terminology.

STRUCTURE:
- words: A complete array of words that form a sentence or short paragraph, blanks are represented by $1, $2, etc. which correspond to the missing words
- answers: array of correct words for the blanks in order as they appear in the sentence as per their $ index
- wrongOptions: array of incorrect options for the blanks to show as distractors

GUIDELINES:
- Write a complete, grammatically correct sentence first
- Choose 1-3 key terms to make blank (their positions go in missingWordIndices)
- Missing words should be guessable from context
- Sentence should test understanding, not just memorization
- Good for reinforcing definitions and key concepts
- Count words by splitting on spaces (index 0 is first word)
- Distractors should be plausible but clearly wrong to someone who understood the concept
- You can have at most 2 blanks in a single sentence to avoid making it too difficult
- You must have atleast 2 wrong options to ensure the question is challenging enough, you may generate more wrong options if you think the question is too easy

EXAMPLE:
{
    "words": ["A", "$1", "is", "a", "named", "container", "that", "stores", "data."],
    "answers": ["variable"],
    "wrongOptions": ["function", "loop", "array"]
}`,
	},
	identify_shown_object_in_image: {
		schema: pageContentSchemas.identify_shown_object_in_image,
		instructions: `Generate an "identify_shown_object_in_image" page for visual identification tasks.

STRUCTURE:
- options: Array of 3-4 possible identifications
- correctOptionIndex: Zero-based index of correct answer

GUIDELINES:
- Only use when visual identification adds educational value
- An image will be generated separately based on context
- Options should be distinct concepts that look similar or could be confused
- Correct answer should be definitively identifiable from the image
- Distractors should be plausible but visually distinguishable
- Good for: identifying code patterns, UI elements, diagrams, data structures, etc.

EXAMPLE (for identifying a Python list in code):
{
  "options": [
    "List declaration",
    "Function definition",
    "Dictionary",
    "Class declaration"
  ],
  "correctOptionIndex": 0
}`,
	},
	matching: {
		schema: pageContentSchemas.matching,
		instructions: `Generate a "matching" page to connect related concepts.

STRUCTURE:
- pairs: Array of 3-5 objects, each with "left" and "right" strings to match

GUIDELINES:
- All pairs should be from the same category/topic
- Left items should be similar type (e.g., all terms, all people, all events)
- Right items should be similar type (e.g., all definitions, all dates, all descriptions)
- Matches should be unambiguous - one clear correct answer per pair
- Good for: term↔definition, cause↔effect, person↔achievement, concept↔example
- Avoid overly similar items that could match multiple partners

EXAMPLE:
{
  "pairs": [
    {"left": "Variable", "right": "Stores data with a name"},
    {"left": "Function", "right": "Reusable block of code"},
    {"left": "Loop", "right": "Repeats code multiple times"},
    {"left": "Conditional", "right": "Executes code based on a condition"}
  ]
}`,
	},
	identify_object_from_images: {
		schema: pageContentSchemas.identify_object_from_images,
		instructions: `Generate an "identify_object_from_images" page where learners identify which image shows a specific concept.

STRUCTURE:
- object: What the learner should find/identify across the images
- images: Array of image prompt objects describing what each image should show
- correctImageIndex: Zero-based index of which image contains the object

GUIDELINES:
- Use when comparing visual elements is educational
- Generate 3-4 image prompts that are similar but show different things
- One image should clearly show the target object
- Other images should show plausible alternatives or near-misses
- Image prompts should describe WHAT to show, not HOW (no art styles)
- Keep prompts clear and focused on educational content
- Good for: identifying correct code patterns, finding specific UI elements, spotting correct diagrams

EXAMPLE:
{
  "object": "A for loop with correct syntax",
  "images": [
    {"prompt": "Python code showing a for loop iterating over a list"},
    {"prompt": "Python code showing a while loop with a counter"},
    {"prompt": "Python code showing an if statement with multiple conditions"},
    {"prompt": "Python code showing a function definition with parameters"}
  ],
  "correctImageIndex": 0
}`,
	},
} as const satisfies Record<
	ChapterPageType,
	{ schema: z.ZodTypeAny; instructions: string }
>;

const instructionsPrefix = `You are an AI specialized in creating educational content for an interactive learning platform. Your task is to generate chapter pages that are engaging, informative, and pedagogically sound. Each page should be designed to reinforce learning objectives and facilitate knowledge retention.`;

const instructions = (type: ChapterPageType) =>
	`${instructionsPrefix} Please create a ${type} page. Here are the detailed instructions for this page type: ${pageContentTypes[type].instructions}`;

export const generateChapterPage = {
	example_uses: createAiGenerateFunction(
		{
			input: generatePageInputSchema,
			output: pageContentTypes.example_uses.schema,
		},
		instructions("example_uses"),
	),
	fill_in_the_blanks: createAiGenerateFunction(
		{
			input: generatePageInputSchema,
			output: pageContentTypes.fill_in_the_blanks.schema,
		},
		instructions("fill_in_the_blanks"),
	),
	quiz: createAiGenerateFunction(
		{
			input: generatePageInputSchema,
			output: pageContentTypes.quiz.schema,
		},
		instructions("quiz"),
	),
	teach_and_explain_content: createAiGenerateFunction(
		{
			input: generatePageInputSchema,
			output: pageContentTypes.teach_and_explain_content.schema,
		},
		instructions("teach_and_explain_content"),
	),
	true_false: createAiGenerateFunction(
		{
			input: generatePageInputSchema,
			output: pageContentTypes.true_false.schema,
		},
		instructions("true_false"),
	),
	identify_shown_object_in_image: createAiGenerateFunction(
		{
			input: generatePageInputSchema,
			output: pageContentTypes.identify_shown_object_in_image.schema,
		},
		instructions("identify_shown_object_in_image"),
	),
	matching: createAiGenerateFunction(
		{
			input: generatePageInputSchema,
			output: pageContentTypes.matching.schema,
		},
		instructions("matching"),
	),
	identify_object_from_images: createAiGenerateFunction(
		{
			input: generatePageInputSchema,
			output: pageContentTypes.identify_object_from_images.schema,
		},
		instructions("identify_object_from_images"),
	),
} satisfies Record<ChapterPageType, unknown>;

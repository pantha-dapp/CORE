import z from "zod";
import { createAiGenerateFunction } from "../engine";

const clarificationQuestionGeneratorPrompt = `You generate short, low-friction clarification questions
for a learning platform.

You must follow these rules strictly:

- Questions must be answerable with minimal effort
- Prefer yes/no, MCQ, or simple selection
- Do NOT ask open-ended questions
- Do NOT repeat previous questions
- Do NOT exceed the requested number of questions
- Do NOT explain why you are asking

Each question must help reduce ambiguity about:
- scope
- depth
- sub-domain
- prerequisites

You may or may not be provided with candidate courses, if provided,
generate clarification questions that help distinguish
between the candidate courses provided, each course is a list of chapters.
each chapter has a title and description.

Rules:
- Ask ONLY what helps choose or reject these courses
- Prefer yes/no or MCQ
- Do NOT repeat past questions
- Generate EXACTLY the requested number

Do not include options inside of mcq question text, only in options array;
Do not include other (please write) in mcq options.

Output JSON only.

example Input:
{
  "inferredGoal": "Learning Python for automating tasks",
  "uncertainties": [
    "What kind of automation (files, web, DevOps, testing)?",
    "Is the scope bigger than just python and libraries?"
  ],
  "previous": [],
  "questionsToGenerate": 3
}

example Output:
{
  "questions": [
    {
      "type": "mcq",
      "text": "What kind of automation are you most interested in?",
      "options": [
        "File and OS automation",
        "Web automation (scraping, bots)",
        "DevOps / server automation",
        "Not sure yet"
      ],
      "purpose": "Identify automation sub-domain"
    },
    {
      "type": "yes_no",
      "text": "Do you already know basic Python syntax?",
      "purpose": "Estimate starting level"
    },
    {
      "type": "yes_no",
      "text": "Is your goal to use automation professionally?",
      "purpose": "Determine depth and rigor"
    }
  ]
}

`;

const clarificationQuestionGeneratorInputSchema = z.object({
	inferredGoal: z.string(),
	uncertainties: z.array(z.string()),
	previous: z.array(
		z.object({
			question: z.string(),
			purpose: z.string(),
			answer: z.string(),
		}),
	),
	questionsToGenerate: z.number(),
	courses: z
		.array(
			z.object({
				title: z.string(),
				description: z.string(),
			}),
		)
		.optional(),
});

const clarificationQuestionGeneratorOutputSchema = z.object({
	questions: z.array(
		z
			.object({
				type: z.literal("yes_no"),
				text: z.string(),
				purpose: z.string(),
			})
			.or(
				z.object({
					type: z.literal("mcq"),
					text: z.string(),
					purpose: z.string(),
					options: z.array(z.string()),
				}),
			),
	),
});

export const clarificationQuestionGenerator = createAiGenerateFunction(
	{
		input: clarificationQuestionGeneratorInputSchema,
		output: clarificationQuestionGeneratorOutputSchema,
	},
	clarificationQuestionGeneratorPrompt,
);

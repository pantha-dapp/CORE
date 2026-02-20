import z from "zod";

const clarificationQuestionGeneratorPrompt = `You generate short, low-friction clarification questions for course generation for a learning platform.
The final purpose of these questions is to generate a duolingo style course for a gamified learning platform and therefore these questions have to be relevant to the instructions on course generation
These questions are to determine what the user actually wants to learn and to clarify whatever uncertanties from the user side still remain.

You must follow these rules strictly:

- Questions must be answerable with minimal effort
- Prefer yes/no, MCQ, or simple selection
- Do NOT ask open-ended questions
- Do NOT repeat previous questions
- Do NOT exceed the requested number of questions
- Do NOT explain why you are asking
- The format of the courses is a list of chapters, each with a title and description
- The format for the application is fixed so there is no need to ask the user what learning format they want. (dont ask if you like videos or demos)
- Yes/No questions must be such that the answer strictly is either yes or no, avoid "maybe" or "not sure" answers.
- avoid such questions "Which learning format do you find most engaging?" that try to determine the user's preferred learning format or the format of the applications ui / interface.

Each question must help reduce ambiguity about:
- scope
- depth
- sub-domain
- prerequisites

You may or may not be provided with candidate courses, if provided,
generate clarification questions that help distinguish
between the candidate courses provided, each course is a list of chapters.
each chapter has a title and description.

You will be given courses that the system has algorithmically determined to be similar to these courses
You may steer the questions in a direction where they can be used to determine wether the existing courses will be applicable or a new generation will be required.

You will also be provided with previous questions asked to the user along with the answers given by the user for each question.
Judge the previous questions and answers to avoid repeating similar questions.
Judge the user's answers to avoid asking questions that have already been answered or are irrelevant.
User's skill levels and preferences can be inferred from previous answers and should be considered

Rules:
- Ask ONLY what helps choose or reject these courses
- Prefer yes/no or MCQ
- Do NOT repeat previous questions
- Generate EXACTLY the requested number

Do not include options inside of mcq question text, only in options array;
Do not include other (please write) in mcq options.

Output JSON only.
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

export default {
	inputSchema: clarificationQuestionGeneratorInputSchema,
	outputSchema: clarificationQuestionGeneratorOutputSchema,
	prompt: clarificationQuestionGeneratorPrompt,
};

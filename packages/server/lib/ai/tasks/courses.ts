import z from "zod";
import { createAiGenerateFunction } from "../engine";

export const intentClarification = createAiGenerateFunction(
	{
		input: z.object({
			majorCategory: z.string(),
			userInput: z.string(),
		}),
		output: z.object({
			inferredGoal: z.string(),
			uncertainties: z.array(z.string()),
			clarificationNeeded: z.boolean(),
		}),
	},
	`You are an intent clarification engine for a learning platform.
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
  ],
  "clarificationNeeded": true
}
`,
);

export const clarificationQuestionGenerator = createAiGenerateFunction(
	{
		input: z.object({
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
		}),
		output: z.object({
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
		}),
	},
	`You generate short, low-friction clarification questions
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

`,
);

export const courseSelectionEvaluator = createAiGenerateFunction(
	{
		input: z.object({
			// currentIntentSummary: z.string(),
			previous: z.array(
				z.object({
					question: z.string(),
					purpose: z.string(),
					answer: z.string(),
				}),
			),
			remainingUncertainties: z.array(z.string()),
			currentCandidateCourses: z.array(
				z.object({
					id: z.number(),
					title: z.string(),
					description: z.string(),
					topics: z.array(z.string()),
				}),
			),
			questionsAsked: z.number(),
			questionBudgetRemaining: z.number(),
		}),
		output: z.object({
			decision: z.enum([
				"ask_more_questions",
				"select_existing_course",
				"create_new_course",
			]),

			uncertantiesRemaining: z.array(z.string()).optional().nullable(),
			questionCount: z.number().optional().nullable(),

			chosenCourseId: z.number().optional().nullable(),

			courseGenerationInstructions: z
				.object({
					courseTitle: z.string(),
					courseDescription: z.string(),
					targetAudience: z.string(),
					assumedPrerequisites: z.array(z.string()),
					constraints: z.object({
						minimumChapters: z.number().min(10),
						granularity: z.string(),
						focus: z.string(),
					}),
				})
				.optional()
				.nullable(),
		}),
	},
	`You are a course-selection decision engine in a mobile learning platform.

In this platform:
- A "course" is a structured learning path defined by chapters and concepts.
- Many courses already exist and should be reused when possible.
- Creating new courses is expensive and should be avoided unless necessary.

Your task is to decide what the system should do next
based on the user's clarified learning intent and
a small set of candidate existing courses.

You do NOT generate course content, chapters, or lessons.

You must choose exactly ONE action:
1) ask_more_questions
   - Use this when the user's intent is still ambiguous
   - Or when more information would help decide between existing courses

2) select_existing_course
   - Use this when one existing course clearly matches the user's intent
   - Prefer reuse over creation whenever reasonable

3) create_new_course
   - Use this ONLY when no existing course fits the user's intent
   - This is a last resort

Decision priorities (most important first):
ask_more_questions > select_existing_course > create_new_course

Be conservative.
Avoid unnecessary questions, but avoid unnecessary new courses even more.

You may ONLY use the information provided in the input.
Do NOT assume missing details.

Output JSON only.

If confidence is below 0.7, prefer ask_more_questions but also consider the budget.

output uncertantiesRemaining and questionCount if and only if decision is ask_more_questions,

output chosenCourseId if and only if decision is select_existing_course,

output courseGenerationInstructions if and only if decision is create_new_course.

Example of courseGenerationInstructions:
{
  "course_title": "Python Automation",
  "course_description": "A comprehensive course focused on using Python to automate file operations, operating system tasks, repetitive workflows, and system-level scripting for practical and professional use.",
  "target_audience": "Learners with basic programming familiarity who want to automate real-world tasks using Python",
  "assumed_prerequisites": [
    "Basic understanding of programming concepts",
    "Familiarity with variables, conditionals, and loops"
  ],
  "constraints": {
    "minimum_chapters": 10, <- must be at least 10
    "granularity": "very fine-grained",
    "focus": "practical automation, not theory-heavy computer science"
  }
}

`,
);

export const generateIdealCourseDescriptor = createAiGenerateFunction(
	{
		input: z.object({
			majorCategory: z.string(),
			inferredGoal: z.string(),
			uncertainties: z.array(z.string()),
		}),
		output: z.object({
			name: z.string(),
			description: z.string(),
			topics: z.array(z.string()),
		}),
	},
	`You generate a descriptor of an ideal course that would match a user's learning intent.

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
`,
);

export const learningIntentSummarizer = createAiGenerateFunction(
	{
		input: z.object({
			majorCategory: z.string(),
			userInput: z.string(),
			clarificationQA: z.array(
				z.object({
					question: z.string(),
					purpose: z.string(),
					answer: z.string(),
				}),
			),
		}),
		output: z.object({
			summary: z.string(),
		}),
	},
	`You update an internal intent summary for a learning platform.

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
example output:
{
  "summary": "A concise summary of the user's learning intent based on confirmed information."}
}`,
);

export function generateCanonicalCourseDescriptor(course: {
	name: string;
	description: string;
	topics: string[];
}) {
	return `
Course: ${course.name}
Description: ${course.description}
Concepts: ${course.topics.join(", ")}
	`;
}

export const generateNewCourseSkeleton = createAiGenerateFunction(
	{
		input: z.object({
			courseTitle: z.string(),
			courseDescription: z.string(),
			targetAudience: z.string(),
			assumedPrerequisites: z.array(z.string()),
			constraints: z.object({
				minimumChapters: z.number(),
				granularity: z.string(),
				focus: z.string(),
			}),
		}),
		output: z.object({
			overview: z.array(
				z.object({
					title: z.string(),
					description: z.string(),
					chapters: {
						title: z.string(),
						description: z.string(),
						topics: z.array(z.string()),
					},
				}),
			),
		}),
	},
	`You are a course-structure generator for a mobile learning platform.

In this platform:
- A course is a long, structured learning path composed of many small chapters.
- Each chapter represents a single, focused learning unit.
- Chapters must be granular enough to be taught in short, interactive sessions.

Your task is to generate a COMPLETE course skeleton.

Rules (STRICT):
- You MUST generate AT LEAST 200 chapters.
- Chapters must be ordered from foundational to advanced.
- Chapters must increase in difficulty gradually.
- Chapters must be concept-focused, not lesson-focused.
- Do NOT generate lesson content, explanations, questions, or examples.
- Do NOT use vague chapter titles like "Advanced Topics".
- Do NOT bundle multiple unrelated ideas into one chapter.

Each chapter MUST include:
- A clear, specific title
- A detailed description explaining what the learner will understand or be able to do after completing the chapter
- A list of concrete topics or sub-concepts covered in that chapter

Descriptions MUST be detailed enough that:
- Another system can generate quizzes, diagrams, and interactive steps from them
- The scope of the chapter is unambiguous

Output JSON only.
Do NOT include commentary or explanations.

Example Output:
{
  "overview": [
    {
      "title": "Introduction to Python Automation",
      "description": "This chapter introduces the concept of automation using Python, covering basic scripting techniques and common use cases.",
      "chapters": [
        {
          "title": "Setting Up Your Python Environment",
          "description": "Learn how to install Python, set up a virtual environment, and manage packages using pip.",
          "topics": [
            "Installing Python",
            "Creating virtual environments",
            "Using pip for package management"
          ]
        },
]    }`,
);

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { categories } from "../../../../data/categories";
import { generateEmbeddings } from "../../../../lib/ai/engine";
import {
	clarificationQuestionGenerator,
	courseSelectionEvaluator,
	generateCanonicalCourseDescriptor,
	generateIdealCourseDescriptor,
	generateNewCourseSkeleton,
	intentClarification,
} from "../../../../lib/ai/tasks/courses";
import dbClient from "../../../../lib/db/client";
import { courses, courseTopics } from "../../../../lib/db/schema/course";
import { createVectorDbClient } from "../../../../lib/db/vec/client";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";

const DEFAULT_QUESTIONS_BUDGET = 20;
const vectorDb = createVectorDbClient("course-embeddings");

type GenerationState = {
	lastSessionStartedAt: number;
	state:
		| "major_category_choice"
		| "learning_intent_freetext"
		| "ask_more_questions"
		| "answer_question"
		| "select_existing_course"
		| "create_new_course"
		| "finished";
	majorCategory?: number;
	learningIntent?: string;
	questionsBudget: number;
	questions: Array<{
		question: string;
		purpose: string;
		answer?: string;
	}>;
	candidateCourses: Array<{
		id: string;
		title: string;
		description: string;
		topics: string[];
	}>;
	uncertainties: Array<string>;
};
const sessionStore = new Map<string, GenerationState>();

export default new Hono()
	.post("/session", authenticated, async (ctx) => {
		const { userWallet } = ctx.var;
		const lastSession = sessionStore.get(userWallet);

		if (lastSession) {
			const { lastSessionStartedAt } = lastSession;
			if (lastSessionStartedAt + 60_000 > Date.now()) {
				return respond.err(
					ctx,
					"A generation session is already active. Please wait before starting a new one.",
					429,
				);
			}
		}

		sessionStore.set(userWallet, {
			state: "major_category_choice",
			lastSessionStartedAt: Date.now(),
			questions: [],
			candidateCourses: [],
			uncertainties: [],
			questionsBudget: DEFAULT_QUESTIONS_BUDGET,
		});
		return respond.ok(ctx, {}, "Session started successfully.", 201);
	})

	.get("/categories", authenticated, async (ctx) => {
		return respond.ok(
			ctx,
			{ categories },
			"Categories fetched successfully.",
			200,
		);
	})

	.post(
		"/action",
		authenticated,
		validator(
			"json",
			z
				.object({
					type: z.literal("major_category_choice"),
					category: z.number(),
				})
				.or(
					z.object({
						type: z.literal("learning_intent_freetext"),
						intent: z.string().min(10),
					}),
				)
				.or(
					z.object({
						type: z.literal("answer_question"),
						answers: z.array(z.string()),
					}),
				),
		),
		async (ctx) => {
			const { userWallet } = ctx.var;
			const action = ctx.req.valid("json");

			const ongoingSession = sessionStore.get(userWallet);
			if (!ongoingSession) {
				return respond.err(
					ctx,
					"No active generation session found. Please start a session first.",
					400,
				);
			}

			if (
				action.type === "major_category_choice" &&
				ongoingSession.state !== "major_category_choice"
			) {
				return respond.err(
					ctx,
					`Invalid action type. Expected state ${ongoingSession.state} but received ${action.type}.`,
					400,
				);
			}

			if (
				action.type === "learning_intent_freetext" &&
				ongoingSession.state !== "learning_intent_freetext"
			) {
				return respond.err(
					ctx,
					`Invalid action type. Expected state ${ongoingSession.state} but received ${action.type}.`,
					400,
				);
			}

			if (
				action.type === "answer_question" &&
				ongoingSession.state !== "ask_more_questions" &&
				ongoingSession.state !== "answer_question"
			) {
				return respond.err(
					ctx,
					`Invalid action type. Expected state ${ongoingSession.state} but received ${action.type}.`,
					400,
				);
			}

			if (action.type === "major_category_choice") {
				ongoingSession.majorCategory = action.category;
				ongoingSession.state = "learning_intent_freetext";

				return respond.ok(
					ctx,
					{
						previousState: ongoingSession.state,
					},
					"Major category recorded. Please provide your learning intent.",
					200,
				);
			}
			if (action.type === "learning_intent_freetext") {
				ongoingSession.learningIntent = action.intent;

				const intentClarificationResult = await intentClarification({
					majorCategory:
						categories[ongoingSession.majorCategory ?? -1] ?? "Others",
					userInput: ongoingSession.learningIntent ?? "",
				});

				ongoingSession.state = "ask_more_questions";
				intentClarificationResult.uncertainties.forEach((u) => {
					ongoingSession.uncertainties.push(u);
				});

				const idealCourse = await generateIdealCourseDescriptor({
					majorCategory:
						categories[ongoingSession.majorCategory ?? -1] ?? "Others",
					inferredGoal: intentClarificationResult.inferredGoal,
					uncertainties: intentClarificationResult.uncertainties,
				});

				const idealCourseDescriptor =
					generateCanonicalCourseDescriptor(idealCourse);
				const queryEmbedding = await generateEmbeddings(idealCourseDescriptor);
				const similarCourses = vectorDb.querySimilar(queryEmbedding, 5);

				if (similarCourses.length > 0) {
					const courseIds = similarCourses
						.filter((c) => c.similarity > 0.7)
						.map((c) => c.id);

					for (const courseId of courseIds) {
						const [course] = await dbClient
							.select()
							.from(courses)
							.where(eq(courses.id, courseId));

						if (course) {
							const topics = await dbClient
								.select()
								.from(courseTopics)
								.where(eq(courseTopics.courseId, courseId));

							ongoingSession.candidateCourses.push({
								id: courseId,
								title: course.title,
								description: course.description,
								topics: topics.map((t) => t.topic),
							});
						}
					}
				}

				const { questions } = await clarificationQuestionGenerator({
					inferredGoal: intentClarificationResult.inferredGoal,
					uncertainties: ongoingSession.uncertainties,
					previous: ongoingSession.questions.filter(
						(q) => q.answer !== undefined,
					) as Array<{
						question: string;
						purpose: string;
						answer: string;
					}>,
					questionsToGenerate: Math.min(3, ongoingSession.questionsBudget),
					courses: ongoingSession.candidateCourses,
				});

				questions.forEach((q) => {
					ongoingSession.questions.push({
						question: q.text,
						purpose: q.purpose,
					});
				});

				return respond.ok(
					ctx,
					{
						state: ongoingSession.state,
						questions: questions,
						questionsBudget: ongoingSession.questionsBudget,
					},
					"Intent clarified. Please answer the questions.",
					200,
				);
			}

			if (action.type === "answer_question") {
				const pendingQuestions = ongoingSession.questions.filter(
					(q) => q.answer === undefined,
				);

				action.answers.forEach((answer, idx) => {
					if (pendingQuestions[idx]) {
						pendingQuestions[idx].answer = answer;
						ongoingSession.questionsBudget--;
					}
				});

				const evaluation = await courseSelectionEvaluator({
					previous: ongoingSession.questions.filter(
						(q) => q.answer !== undefined,
					) as Array<{
						question: string;
						purpose: string;
						answer: string;
					}>,
					currentCandidateCourses: ongoingSession.candidateCourses.map(
						(course, idx) => ({
							...course,
							id: idx,
						}),
					),
					questionBudgetRemaining: ongoingSession.questionsBudget,
					questionsAsked:
						DEFAULT_QUESTIONS_BUDGET - ongoingSession.questionsBudget,
					remainingUncertainties: ongoingSession.uncertainties,
				});

				if (evaluation.decision === "ask_more_questions") {
					ongoingSession.uncertainties =
						evaluation.uncertantiesRemaining || ongoingSession.uncertainties;

					const { questions } = await clarificationQuestionGenerator({
						inferredGoal: "",
						uncertainties: ongoingSession.uncertainties,
						previous: ongoingSession.questions.filter(
							(q) => q.answer !== undefined,
						) as Array<{
							question: string;
							purpose: string;
							answer: string;
						}>,
						questionsToGenerate: Math.min(
							evaluation.questionCount || 3,
							ongoingSession.questionsBudget,
						),
						courses: ongoingSession.candidateCourses,
					});

					questions.forEach((q) => {
						ongoingSession.questions.push({
							question: q.text,
							purpose: q.purpose,
						});
					});

					return respond.ok(
						ctx,
						{
							state: ongoingSession.state,
							questions: questions,
							questionsBudget: ongoingSession.questionsBudget,
						},
						"Generating more questions.",
						200,
					);
				}

				if (evaluation.decision === "select_existing_course") {
					ongoingSession.state = "select_existing_course";

					const selectedCourse =
						ongoingSession.candidateCourses[evaluation.chosenCourseId ?? 0];

					return respond.ok(
						ctx,
						{
							state: ongoingSession.state,
							courseId: selectedCourse?.id,
							courseTitle: selectedCourse?.title,
						},
						"Existing course selected.",
						200,
					);
				}

				if (evaluation.decision === "create_new_course") {
					ongoingSession.state = "create_new_course";

					if (!evaluation.courseGenerationInstructions) {
						return respond.err(
							ctx,
							"No instructions for course generation",
							500,
						);
					}

					const newCourse = await generateNewCourseSkeleton(
						evaluation.courseGenerationInstructions,
					);

					const courseId = crypto.randomUUID();
					await dbClient.insert(courses).values({
						id: courseId,
						title: evaluation.courseGenerationInstructions.courseTitle,
						description:
							evaluation.courseGenerationInstructions.courseDescription,
					});

					const canonicalDescriptor = generateCanonicalCourseDescriptor({
						name: evaluation.courseGenerationInstructions.courseTitle,
						description:
							evaluation.courseGenerationInstructions.courseDescription,
						topics:
							evaluation.courseGenerationInstructions.assumedPrerequisites,
					});
					const embedding = await generateEmbeddings(canonicalDescriptor);
					vectorDb.writeEntry(courseId, embedding);

					ongoingSession.state = "finished";

					return respond.ok(
						ctx,
						{
							state: ongoingSession.state,
							course: newCourse,
							courseId: courseId,
						},
						"New course generated successfully.",
						200,
					);
				}
			}
		},
	)

	.get("/session", authenticated, async (ctx) => {
		const { userWallet } = ctx.var;
		const session = sessionStore.get(userWallet);

		if (!session) {
			return respond.err(ctx, "No active generation session found.", 404);
		}

		return respond.ok(
			ctx,
			{
				state: session.state,
				questionsBudget: session.questionsBudget,
				questionsAnswered: session.questions.filter(
					(q) => q.answer !== undefined,
				).length,
				totalQuestions: session.questions.length,
			},
			"Session state retrieved successfully.",
			200,
		);
	});

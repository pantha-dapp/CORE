import { tryCatch } from "@pantha/shared";
import { MINUTE } from "@pantha/shared/constants";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { categories } from "../../../../data/categories";
import type clarificationQuestionGenerator from "../../../../lib/ai/tasks/clarificationQuestionGenerator";
import { generateCanonicalCourseDescriptor } from "../../../../lib/ai/tasks/utils";
import { createVectorDb } from "../../../../lib/db/vec/client";
import { RateLimitExceededError } from "../../../../lib/errors";
import { insertCourseIntoVectorDb } from "../../../../lib/utils/courses";
import { respond } from "../../../../lib/utils/respond";
import { authenticated } from "../../../middleware/auth";
import { validator } from "../../../middleware/validator";
import { createJob } from "../../jobs";
import type { RouterEnv } from "../../types";

const DEFAULT_QUESTIONS_BUDGET = 20;
// const vectorDb = createVectorDbClient("course-embeddings");

type GenerationState = {
	lastSessionStartedAt: number;
	state:
		| "major_category_choice"
		| "learning_intent_freetext"
		| "answer_question"
		| "finished";
	courseId?: string;
	majorCategory?: number;
	learningIntent?: string;
	inferredGoal?: string;
	questionsBudget: number;
	questions: Array<
		z.infer<
			typeof clarificationQuestionGenerator.outputSchema
		>["questions"][number] & { answer?: string; key: string }
	>;
	candidateCourses: Array<{
		id: string;
		title: string;
		description: string;
		topics: string[];
	}>;
	uncertainties: Array<string>;

	lock: boolean;
};
const sessionStore = new Map<string, GenerationState>();

export default new Hono<RouterEnv>()

	.get("/session", authenticated, async (ctx) => {
		const { userWallet } = ctx.var;
		let session = sessionStore.get(userWallet);

		if (session) {
			const { lastSessionStartedAt } = session;
			if (lastSessionStartedAt + 10 * MINUTE > Date.now()) {
				return respond.ok(
					ctx,
					{
						session,
					},
					"Session state retrieved successfully.",
					200,
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
			lock: false,
		});
		session = sessionStore.get(userWallet);

		if (!session) {
			return respond.err(ctx, "No generation of session was possible.", 404);
		}

		return respond.ok(
			ctx,
			{
				session,
			},
			"Session started successfully.",
			201,
		);
	})

	.delete("/session", authenticated, async (ctx) => {
		const { userWallet } = ctx.var;
		sessionStore.delete(userWallet);
		return respond.ok(ctx, {}, "Session deleted successfully.", 200);
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
						questionKey: z.string(),
						answer: z.string(),
					}),
				),
		),
		async (ctx) => {
			const { db, ai, eventBus } = ctx.var.appState;
			const { userWallet } = ctx.var;
			const action = ctx.req.valid("json");

			const coursesVectorDb = createVectorDb(db.vector, "course-embeddings");

			const ongoingSession = sessionStore.get(userWallet);
			if (!ongoingSession) {
				return respond.err(
					ctx,
					"No active generation session found. Please start a session first.",
					400,
				);
			}

			if (action.type !== ongoingSession.state) {
				return respond.err(
					ctx,
					`Invalid action type. Expected state ${ongoingSession.state} but received ${action.type}.`,
					400,
				);
			}

			if (ongoingSession.lock) {
				throw new RateLimitExceededError(
					"Your previous action is still being processed. Please wait a moment before taking another action.",
				);
			}
			ongoingSession.lock = true;

			if (action.type === "major_category_choice") {
				ongoingSession.majorCategory = action.category;
				ongoingSession.state = "learning_intent_freetext";

				ongoingSession.lock = false;

				return respond.ok(
					ctx,
					{
						state: ongoingSession.state,
						jobId: null,
					},
					"Major category recorded. Please provide your learning intent.",
					200,
				);
			}

			if (action.type === "learning_intent_freetext") {
				ongoingSession.learningIntent = action.intent;
				const { id: jobId, promise: jobPromise } = createJob(
					ctx.var.appState.db.redis,
					async () => {
						const intentClarificationResult = await tryCatch(
							ai.llm.intentClarification({
								majorCategory:
									categories[ongoingSession.majorCategory ?? -1] ?? "Others",
								userInput: ongoingSession.learningIntent ?? "",
							}),
						);

						if (intentClarificationResult.error) {
							console.error(intentClarificationResult.error);
							throw "Failed to clarify user learning intent.";
						}

						const intentClarificationData = intentClarificationResult.data;
						ongoingSession.inferredGoal = intentClarificationData.inferredGoal;

						intentClarificationData.uncertainties.forEach((u) => {
							ongoingSession.uncertainties.push(u);
						});
						ongoingSession.state = "answer_question";

						const clarificationQuestionResult = await tryCatch(
							ai.llm.clarificationQuestionGenerator({
								inferredGoal: intentClarificationData.inferredGoal,
								uncertainties: ongoingSession.uncertainties,
								previous: ongoingSession.questions.map((q) => ({
									question: q.text,
									purpose: q.purpose,
									answer: q.answer ?? "unanswered",
								})),
								questionsToGenerate: Math.min(
									3,
									ongoingSession.questionsBudget,
								),
								courses: ongoingSession.candidateCourses,
							}),
						);
						if (clarificationQuestionResult.error) {
							throw "Failed to generate clarification questions.";
						}
						const { questions } = clarificationQuestionResult.data;

						questions.slice(0, ongoingSession.questionsBudget).forEach((q) => {
							ongoingSession.questionsBudget--;
							ongoingSession.questions.push({
								...q,
								key: crypto.randomUUID().slice(0, 8),
							});
						});
					},
				);

				jobPromise.finally(() => {
					ongoingSession.lock = false;
				});

				return respond.ok(
					ctx,
					{
						state: ongoingSession.state,
						jobId: jobId,
					},
					"Intent recorded. Generating clarification questions.",
					202,
				);
			}

			if (action.type === "answer_question") {
				ongoingSession.questions.forEach((q) => {
					if (q.key === action.questionKey) {
						q.answer = action.answer;
					}
				});

				const pendingQuestions = ongoingSession.questions.filter(
					(q) => q.answer === undefined,
				);

				if (pendingQuestions.length > 0) {
					ongoingSession.lock = false;

					return respond.ok(
						ctx,
						{
							state: ongoingSession.state,
							jobId: null,
						},
						"Answer recorded. Please answer the remaining questions.",
						200,
					);
				}

				const { id: jobId, promise: jobPromise } = createJob(
					ctx.var.appState.db.redis,
					async () => {
						const idealCourseResult = await tryCatch(
							ai.llm.generateIdealCourseDescriptor({
								majorCategory:
									categories[ongoingSession.majorCategory ?? -1] ?? "Others",
								inferredGoal: ongoingSession.inferredGoal ?? "",
								learningIntent: ongoingSession.learningIntent ?? "",
								uncertainties: ongoingSession.uncertainties,
								previous: ongoingSession.questions.map((q) => ({
									question: q.text,
									purpose: q.purpose,
									answer: q.answer || "",
								})),
							}),
						);

						if (idealCourseResult.error) {
							throw "Failed to generate ideal course descriptor.";
						}
						const idealCourse = idealCourseResult.data;
						const idealCourseDescriptor =
							generateCanonicalCourseDescriptor(idealCourse);
						const idealCourseDescriptorEmbedding = await ai.embedding.text(
							idealCourseDescriptor,
						);
						const similarCoursesToIdeal = await coursesVectorDb.querySimilar(
							idealCourseDescriptorEmbedding,
							5,
						);

						// Push all candidate courses to the ongoing session's state
						ongoingSession.candidateCourses = [];
						if (similarCoursesToIdeal.length > 0) {
							const courseIds: string[] = similarCoursesToIdeal
								.filter((c) => {
									return c.score > 0.7;
								})
								.map((c) => c.id);

							for (const courseId of courseIds) {
								const course = await db.courseById({ courseId });

								if (course) {
									const topics = await db
										.select()
										.from(db.schema.courseTopics)
										.where(eq(db.schema.courseTopics.courseId, courseId));

									ongoingSession.candidateCourses.push({
										id: courseId,
										title: course.title,
										description: course.description,
										topics: topics.map((t) => t.topic),
									});
								}
							}
						}

						const courseSelectionEvaluatorResult = await tryCatch(
							ai.llm.courseSelectionEvaluator({
								previous: ongoingSession.questions.map((q) => ({
									question: q.text,
									purpose: q.purpose,
									answer: q.answer || "unanswered",
								})),
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
							}),
						);
						if (courseSelectionEvaluatorResult.error) {
							console.error(courseSelectionEvaluatorResult.error);
							throw "Failed to evaluate course selection.";
						}
						const evaluation = courseSelectionEvaluatorResult.data;

						if (evaluation.decision === "ask_more_questions") {
							ongoingSession.uncertainties =
								evaluation.uncertantiesRemaining ||
								ongoingSession.uncertainties;

							if (ongoingSession.questionsBudget <= 0) {
								// Budget exhausted — cannot ask more questions; fail the job
								// so the client sees a failure rather than a silently stuck session.
								throw "Question budget exhausted. Please restart the session.";
							} else {
								const clarificationQuestionGeneratorResult = await tryCatch(
									ai.llm.clarificationQuestionGenerator({
										inferredGoal: ongoingSession.inferredGoal ?? "",
										uncertainties: ongoingSession.uncertainties,
										previous: ongoingSession.questions.map((q) => ({
											question: q.text,
											purpose: q.purpose,
											answer: q.answer ?? "unanswered",
										})),
										questionsToGenerate: Math.min(
											evaluation.questionCount || 3,
											ongoingSession.questionsBudget,
										),
										courses: ongoingSession.candidateCourses,
									}),
								);
								if (clarificationQuestionGeneratorResult.error) {
									throw "Failed to generate additional clarification questions.";
								}
								const { questions } = clarificationQuestionGeneratorResult.data;

								questions
									.slice(0, ongoingSession.questionsBudget)
									.forEach((q) => {
										ongoingSession.questionsBudget--;
										ongoingSession.questions.push({
											...q,
											key: crypto.randomUUID().slice(0, 8),
										});
									});
							}
						}

						if (evaluation.decision === "select_existing_course") {
							if (
								evaluation.chosenCourseId === null ||
								evaluation.chosenCourseId === undefined
							) {
								throw "No course ID chosen for enrollment";
							}
							const chosenCourseId =
								ongoingSession.candidateCourses[evaluation.chosenCourseId]?.id;
							if (!chosenCourseId) {
								throw "Chosen course ID is invalid";
							}

							const enrollmentResult = await tryCatch(
								db.enrollUserInCourse({
									userWallet: userWallet,
									courseId: chosenCourseId,
								}),
							);
							if (enrollmentResult.error) {
								throw "Failed to enroll user in the chosen course.";
							}

							ongoingSession.state = "finished";
							ongoingSession.courseId = chosenCourseId;
						}

						if (evaluation.decision === "create_new_course") {
							let generatedCourseId = "";
							if (!evaluation.courseGenerationInstructions) {
								throw "No instructions for course generation";
							}
							const newCourse = await ai.llm.generateNewCourseSkeleton(
								evaluation.courseGenerationInstructions,
							);

							let firstChapterId = "";
							await db
								.transaction(async (tx) => {
									if (!evaluation.courseGenerationInstructions) {
										throw "No instructions for course generation";
									}
									const courseId = crypto.randomUUID();

									await tx.insert(db.schema.courses).values({
										id: courseId,
										title: evaluation.courseGenerationInstructions.courseTitle,
										description:
											evaluation.courseGenerationInstructions.courseDescription,
										icon: { prompt: newCourse.overview.icon, url: null },
									});

									await insertCourseIntoVectorDb(
										courseId,
										{
											title:
												evaluation.courseGenerationInstructions.courseTitle,
											description:
												evaluation.courseGenerationInstructions
													.courseDescription,
											topics:
												evaluation.courseGenerationInstructions
													.assumedPrerequisites,
										},
										{ db, ai },
									);
									generatedCourseId = courseId;

									for (const topic of newCourse.overview.topics) {
										await tx.insert(db.schema.courseTopics).values({
											courseId: courseId,
											topic: topic,
											id: crypto.randomUUID(),
										});
									}

									let chapterOrder = 0;
									for (const chapter of newCourse.overview.chapters) {
										const chapterId = crypto.randomUUID();
										const [insertedChapter] = await tx
											.insert(db.schema.courseChapters)
											.values({
												courseId: courseId,
												description: chapter.description,
												id: chapterId,
												title: chapter.title,
												intent: chapter.intent,
												order: chapterOrder++,
												icon: { prompt: chapter.icon, url: null },
											})
											.returning({ id: db.schema.courseChapters.id });

										if (!insertedChapter || !insertedChapter.id) {
											throw "Failed to insert course chapter.";
										}

										if (!firstChapterId) {
											firstChapterId = insertedChapter.id;
										}

										for (const topic of chapter.topics) {
											await tx.insert(db.schema.chapterTopics).values({
												id: crypto.randomUUID(),
												chapterId: insertedChapter.id,
												topic: topic,
											});
										}
									}
								})
								.catch((err) => {
									if (generatedCourseId) {
										coursesVectorDb.deleteEntry(generatedCourseId);
									}
									throw err;
								});

							await db.enrollUserInCourse({
								userWallet: userWallet,
								courseId: generatedCourseId,
							});

							eventBus.emit("course.generate", {
								walletAddress: userWallet,
								courseId: generatedCourseId,
							});

							ongoingSession.state = "finished";
							ongoingSession.courseId = generatedCourseId;
						}
					},
				);

				jobPromise.finally(() => {
					ongoingSession.lock = false;
				});

				return respond.ok(
					ctx,
					{
						state: ongoingSession.state,
						jobId: jobId,
					},
					"Answers recorded. Evaluating next steps.",
					202,
				);
			}

			return respond.err(ctx, "Unhandled action type.", 400);
		},
	);

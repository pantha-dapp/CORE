import readline from "node:readline";
import {
	clarificationQuestionGenerator,
	courseSelectionEvaluator,
	generateNewCourseSkeleton,
	intentClarification,
} from "./ai/tasks/courseClarification";
import { categories } from "./data/categories";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
}

async function main() {
	console.log(
		"Categories :\n",
		categories.map((cat, idx) => `${idx + 1}. ${cat}`).join("\n"),
	);

	const answer = await askQuestion("Select a category by number: ");
	const selectedCategory = parseInt(answer, 10) - 1;
	console.log(`You selected: ${categories[selectedCategory]}`);

	const userInput = await askQuestion("Enter your learning goal or topic: ");
	console.log(`You entered: ${userInput}`);

	const intentClarificationResult = await intentClarification({
		majorCategory: categories[selectedCategory] ?? "Others",
		userInput: userInput,
	});

	console.log(JSON.stringify(intentClarificationResult, null, 2));

	let courseDecided = 0;
	let uncertainties = intentClarificationResult.uncertainties;
	const previousQuestions: Array<{
		question: string;
		purpose: string;
		answer: string;
	}> = [];
	const candidateCourses: Array<{
		title: string;
		description: string;
		topics: string[];
	}> = [];

	const maxQuestions = 8;
	let questionsBudget = maxQuestions;
	let nextQuestionsCount = 3;

	while (courseDecided === 0 && questionsBudget > 0) {
		const questions = await clarificationQuestionGenerator({
			inferredGoal: intentClarificationResult.inferredGoal,
			uncertainties: uncertainties,
			previous: previousQuestions,
			questionsToGenerate: Math.min(nextQuestionsCount, questionsBudget),
			courses: candidateCourses,
		});
		for (const q of questions.questions) {
			questionsBudget--;
			const userAnswer = await askQuestion(
				`Clarification \n ${JSON.stringify(q, null, 2)}: `,
			);
			previousQuestions.push({
				question: q.text,
				purpose: q.purpose,
				answer: userAnswer,
			});
		}

		const evaluation = await courseSelectionEvaluator({
			previous: previousQuestions,
			currentCandidateCourses: [],
			questionBudgetRemaining: questionsBudget,
			questionsAsked: maxQuestions - questionsBudget,
			remainingUncertainties: uncertainties,
		});
		console.log(JSON.stringify(evaluation, null, 2));
		if (evaluation.decision === "ask_more_questions") {
			uncertainties = evaluation.uncertantiesRemaining || uncertainties;
			nextQuestionsCount = evaluation.questionCount || nextQuestionsCount;
		}
		if (evaluation.decision === "select_existing_course") {
			courseDecided = evaluation.chosenCourseId ?? 0;
		}
		if (evaluation.decision === "create_new_course") {
			courseDecided = -1;
			if (!evaluation.courseGenerationInstructions) {
				console.error("No instructions for course generation");
				break;
			}

			const newCourse = await generateNewCourseSkeleton(
				evaluation.courseGenerationInstructions,
			);
			await Bun.file("./ghus.json").write(JSON.stringify(newCourse, null, 2));
		}
	}
}

main().then(() => {
	rl.close();
});

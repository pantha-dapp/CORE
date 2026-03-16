import clarificationQuestionGenerator from "./clarificationQuestionGenerator";
import courseSelectionEvaluator from "./courseSelectionEvaluator";
import generateAnswerExplanation from "./generateAnswerExplanation";
import generateChapterPages from "./generateChapterPages.legacy";
import generateIdealCourseDescriptor from "./generateIdealCourseDescriptor";
import generateNewCourseSkeleton from "./generateNewCourseSkeleton";
import intentClarification from "./intentClarification";
import learningIntentSummarizer from "./learningIntentSummarizer";

const tasks = {
	clarificationQuestionGenerator,
	courseSelectionEvaluator,
	generateAnswerExplanation,
	generateChapterPages,
	generateIdealCourseDescriptor,
	generateNewCourseSkeleton,
	intentClarification,
	learningIntentSummarizer,
};

export default tasks;

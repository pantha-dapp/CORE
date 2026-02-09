import clarificationQuestionGenerator from "./clarificationQuestionGenerator";
import courseSelectionEvaluator from "./courseSelectionEvaluator";
import { generateChapterPage } from "./generateChapterPage";
import generateChapterPages from "./generateChapterPages.legacy";
import generateChapterPagesOverview from "./generateChapterPagesOverview";
import generateIdealCourseDescriptor from "./generateIdealCourseDescriptor";
import generateNewCourseSkeleton from "./generateNewCourseSkeleton";
import intentClarification from "./intentClarification";
import learningIntentSummarizer from "./learningIntentSummarizer";

const tasks = {
	clarificationQuestionGenerator,
	courseSelectionEvaluator,
	generateChapterPage,
	generateChapterPages,
	generateChapterPagesOverview,
	generateIdealCourseDescriptor,
	generateNewCourseSkeleton,
	intentClarification,
	learningIntentSummarizer,
};

export default tasks;

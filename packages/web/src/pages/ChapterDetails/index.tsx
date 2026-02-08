import {
	useChapterGameAnswer,
	useChapterGameSession,
	useChapterPages,
	useCourseById,
	useCourseChaptersByCourseId,
} from "@pantha/react/hooks";
import { useParams, useRouter } from "@tanstack/react-router";
import Button from "../../shared/components/Button";
import { CompletionScreen } from "./components/CompletionScreen";
import { ExampleUses } from "./components/ExampleUses";
import { Matching } from "./components/Matching";
import { Quiz } from "./components/Quiz";
import { TeachContent } from "./components/TeachContent";
import { TrueFalse } from "./components/TrueFalse";

export default function ChapterDetails() {
	const { courseId, chapterId } = useParams({ strict: false });
	const router = useRouter();

	const { data: course, isLoading: courseLoading } = useCourseById({
		id: courseId ?? "",
	});
	const { data: chaptersData, isLoading: chaptersLoading } =
		useCourseChaptersByCourseId({
			courseId: courseId ?? "",
		});
	const { data: pagesData, isLoading: pagesLoading } = useChapterPages({
		chapterId: chapterId ?? "",
	});
	const { data: session, isLoading: sessionLoading } = useChapterGameSession({
		chapterId: chapterId ?? "",
	});
	const submitAnswer = useChapterGameAnswer({ chapterId: chapterId ?? "" });

	const isLoading =
		courseLoading || chaptersLoading || pagesLoading || sessionLoading;

	if (isLoading) {
		return (
			<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
					<p className="text-gray-400">Loading chapter...</p>
				</div>
			</div>
		);
	}

	const currentChapter = chaptersData?.chapters.find(
		(ch) => ch.id === chapterId,
	);

	if (!course || !chaptersData || !pagesData || !currentChapter) {
		return (
			<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-3xl font-bold mb-4">Chapter Not Found</h1>
					<p className="text-gray-400 mb-8">
						The chapter you're looking for doesn't exist.
					</p>
					<Button onClick={() => router.navigate({ to: "/" })}>
						← Go Home
					</Button>
				</div>
			</div>
		);
	}

	const currentPageIndex = session?.currentPage ?? 0;
	const totalPages = pagesData.pages.length;
	const currentPage = pagesData.pages[currentPageIndex];
	const isComplete = currentPageIndex >= totalPages;

	async function handleAnswerSubmit(answer: string[]) {
		try {
			await submitAnswer.mutateAsync({ answer });
		} catch (error) {
			console.error("Error submitting answer:", error);
		}
	}

	function handleBackClick() {
		router.navigate({ to: `/chapters/${courseId}` });
	}

	function renderPage(page: NonNullable<typeof currentPage>) {
		const { content, type } = page.content;

		switch (type) {
			case "teach_and_explain_content":
				return (
					<TeachContent
						{...content}
						// imageUrl={imageUrl}
						onContinue={() => handleAnswerSubmit(["continue"])}
					/>
				);

			case "example_uses":
				return (
					<ExampleUses
						{...content}
						// imageUrl={imageUrl}
						onContinue={() => handleAnswerSubmit(["continue"])}
					/>
				);

			case "quiz":
				return (
					<Quiz
						{...content}
						// imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
					/>
				);

			case "true_false":
				return (
					<TrueFalse
						{...content}
						// imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
					/>
				);

			// case "fill_in_the_blanks":
			// return (
			// <FillInTheBlanks
			// 	{...content}
			// imageUrl={imageUrl}
			// 	onSubmit={handleAnswerSubmit}
			// />
			// );

			case "matching":
				return (
					<Matching
						{...content}
						// imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
					/>
				);

			default:
				return (
					<div className="text-center p-8">
						<p className="text-red-400">Unsupported content type</p>
					</div>
				);
		}
	}

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<Button onClick={handleBackClick} className="mb-6">
					← Back to Chapters
				</Button>

				<div className="mb-6">
					<p className="text-sm text-gray-400">{course.title}</p>
					<h1 className="text-4xl font-bold mt-1">{currentChapter.title}</h1>
					{currentChapter.description && (
						<p className="text-gray-300 mt-2">{currentChapter.description}</p>
					)}
				</div>

				{/* Progress Bar */}
				{!isComplete && (
					<div className="mb-8">
						<div className="flex justify-between text-sm text-gray-400 mb-2">
							<span className="font-semibold">Progress</span>
							<span className="font-mono">
								{currentPageIndex + 1} / {totalPages}
							</span>
						</div>
						<div className="w-full bg-gray-700 rounded-full h-3">
							<div
								className="bg-linear-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
								style={{
									width: `${((currentPageIndex + 1) / totalPages) * 100}%`,
								}}
							/>
						</div>
					</div>
				)}

				{/* Content */}
				<div className="bg-gray-800 rounded-xl p-6 shadow-lg">
					{isComplete ? (
						<CompletionScreen
							correctCount={0}
							incorrectCount={0}
							totalPages={totalPages}
							onBackClick={handleBackClick}
						/>
					) : currentPage ? (
						renderPage(currentPage)
					) : (
						<div className="text-center p-8">
							<p className="text-gray-400">No content available</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

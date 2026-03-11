import {
	useAnswerExplanation,
	useChapterGameAnswer,
	useChapterGameSession,
	useChapterGameSessionDelete,
	useChapterPages,
	useCourseById,
	useCourseChaptersByCourseId,
} from "@pantha/react/hooks";
import { useParams, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import Button from "../../shared/components/Button";
import { CompletionScreen } from "./components/CompletionScreen";
import { ExampleUses } from "./components/ExampleUses";
import { FillInTheBlanks } from "./components/FillInTheBlanks";
import { IdentifyObjectFromImages } from "./components/IdentifyObjectFromImages";
import { IdentifyShownObjectInImage } from "./components/IdentifyShownObjectInImage";
import { Matching } from "./components/Matching";
import { Quiz } from "./components/Quiz";
import { TeachContent } from "./components/TeachContent";
import { TrueFalse } from "./components/TrueFalse";

export default function ChapterDetails() {
	const { courseId, chapterId } = useParams({ strict: false });
	const router = useRouter();

	const [completionReport, setCompletionReport] = useState<{
		correct: number;
		incorrect: number;
	} | null>(null);
	const [pendingCompletionReport, setPendingCompletionReport] = useState<{
		correct: number;
		incorrect: number;
	} | null>(null);
	const [answerResult, setAnswerResult] = useState<{
		correct: boolean;
		pageIndex: number;
	} | null>(null);
	const [isExplanationOpen, setIsExplanationOpen] = useState(false);
	const [explanationPageIndex, setExplanationPageIndex] = useState<
		number | null
	>(null);
	const [loadedExplanationPageIndex, setLoadedExplanationPageIndex] = useState<
		number | null
	>(null);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteSessionMutation = useChapterGameSessionDelete();
	const answerExplanation = useAnswerExplanation();

	// Swipe detection state
	// const swipeStartX = useRef(0);
	// const swipeStartY = useRef(0);
	// const SWIPE_THRESHOLD = 30; // Reduced for mobile: minimum pixels to detect swipe
	// const MAX_VERTICAL_DISTANCE = 80; // Maximum vertical movement allowed
	const { data: course, isLoading: courseLoading } = useCourseById({
		id: courseId ?? "",
	});
	const { data: chaptersData, isLoading: chaptersLoading } =
		useCourseChaptersByCourseId({
			courseId: courseId,
		});
	const { data: pagesData, isLoading: pagesLoading } = useChapterPages({
		chapterId,
	});
	const { data: session, isLoading: sessionLoading } = useChapterGameSession({
		chapterId,
	});
	const submitAnswer = useChapterGameAnswer({ chapterId: chapterId ?? "" });

	// Swipe gesture handling
	// useEffect(() => {
	// 	const handlePointerDown = (e: PointerEvent) => {
	// 		swipeStartX.current = e.clientX;
	// 		swipeStartY.current = e.clientY;
	// 		console.log("Pointer Down:", { x: e.clientX, y: e.clientY });
	// 	};

	// 	const handlePointerUp = (e: PointerEvent) => {
	// 		const swipeEndX = e.clientX;
	// 		const swipeEndY = e.clientY;

	// 		// Calculate swipe distance
	// 		// Negative = swiping right (go back gesture on mobile)
	// 		// Positive = swiping left
	// 		const swipeDistanceX = swipeStartX.current - swipeEndX;
	// 		const swipeDistanceY = Math.abs(swipeStartY.current - swipeEndY);
	// 		const absoluteSwipeX = Math.abs(swipeDistanceX);

	// 		console.log("Pointer Up - Swipe Distances:", {
	// 			swipeDistanceX: swipeDistanceX,
	// 			absoluteSwipeX: absoluteSwipeX,
	// 			verticalDistance: swipeDistanceY,
	// 			startX: swipeStartX.current,
	// 			startY: swipeStartY.current,
	// 			endX: swipeEndX,
	// 			endY: swipeEndY,
	// 			threshold: SWIPE_THRESHOLD,
	// 			maxVertical: MAX_VERTICAL_DISTANCE,
	// 			direction: swipeDistanceX < 0 ? "RIGHT (Go Back)" : "LEFT",
	// 		});

	// 		// Support both:
	// 		// - RIGHT swipe (negative value) = standard mobile back gesture
	// 		// - LEFT swipe (positive value) = alternative gesture
	// 		// The absolute value must be greater than threshold and vertical movement must be minimal
	// 		const isValidSwipe =
	// 			absoluteSwipeX > SWIPE_THRESHOLD &&
	// 			swipeDistanceY < MAX_VERTICAL_DISTANCE;

	// 		console.log("Is Valid Swipe?", isValidSwipe);

	// 		if (isValidSwipe) {
	// 			console.log("SWIPE DETECTED! Opening dialog...");
	// 			handleBackClick();
	// 		}
	// 	};

	// 	document.addEventListener("pointerdown", handlePointerDown);
	// 	document.addEventListener("pointerup", handlePointerUp);

	// 	console.log("Swipe detection listener attached");

	// 	return () => {
	// 		document.removeEventListener("pointerdown", handlePointerDown);
	// 		document.removeEventListener("pointerup", handlePointerUp);
	// 		console.log("Swipe detection listener removed");
	// 	};
	// }, []);

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
	console.log("pages length", totalPages);
	const displayedPageIndex = answerResult?.pageIndex ?? currentPageIndex;
	const currentPage = pagesData.pages[displayedPageIndex];
	const isShowingAnswerResult = answerResult !== null;
	const explanationContent = answerExplanation.data?.explanation;
	const isExplanationReady =
		answerResult !== null &&
		loadedExplanationPageIndex === answerResult.pageIndex &&
		Boolean(explanationContent);
	const isExplanationLoadingForCurrentAnswer =
		answerResult !== null &&
		explanationPageIndex === answerResult.pageIndex &&
		(loadedExplanationPageIndex !== answerResult.pageIndex ||
			answerExplanation.isFetching);
	const isExplanationErrorForCurrentAnswer =
		answerResult !== null &&
		explanationPageIndex === answerResult.pageIndex &&
		loadedExplanationPageIndex !== answerResult.pageIndex &&
		answerExplanation.isError &&
		!answerExplanation.isFetching;
	const isComplete =
		!isShowingAnswerResult &&
		(completionReport !== null || currentPageIndex >= totalPages);

	async function refreshExplanationForPage(pageIndex: number) {
		setExplanationPageIndex(pageIndex);
		setLoadedExplanationPageIndex(null);

		try {
			const result = await answerExplanation.refetch();

			if (result.data?.explanation) {
				setLoadedExplanationPageIndex(pageIndex);
			}
		} catch (error) {
			console.error("Error fetching answer explanation:", error);
		}
	}

	async function handleAnswerSubmit(answer: string[]) {
		if (submitAnswer.isPending) {
			return;
		}

		try {
			const submittedPageIndex = displayedPageIndex;
			setIsExplanationOpen(false);
			setExplanationPageIndex(submittedPageIndex);
			setLoadedExplanationPageIndex(null);
			const result = await submitAnswer.mutateAsync({ answer });
			if (typeof result?.correct === "boolean") {
				setAnswerResult({
					correct: result.correct,
					pageIndex: submittedPageIndex,
				});
				void refreshExplanationForPage(submittedPageIndex);
			}

			if (result?.complete) {
				setPendingCompletionReport({
					correct: result.report?.correct ?? 0,
					incorrect:
						(result.report?.total ?? 0) - (result.report?.correct ?? 0),
				});
			}
		} catch (error) {
			console.error("Error submitting answer:", error);
		}
	}

	async function handleContentContinue() {
		if (submitAnswer.isPending) {
			return;
		}

		try {
			const result = await submitAnswer.mutateAsync({ answer: ["continue"] });

			if (result?.complete) {
				setCompletionReport({
					correct: result.report?.correct ?? 0,
					incorrect:
						(result.report?.total ?? 0) - (result.report?.correct ?? 0),
				});
			}
		} catch (error) {
			console.error("Error continuing content:", error);
		}
	}

	function handleAnswerContinue() {
		if (pendingCompletionReport) {
			setCompletionReport(pendingCompletionReport);
			setPendingCompletionReport(null);
		}

		setIsExplanationOpen(false);
		setExplanationPageIndex(null);
		setLoadedExplanationPageIndex(null);
		setAnswerResult(null);
	}

	function handleOpenExplanation() {
		if (!answerResult) {
			return;
		}

		setIsExplanationOpen(true);

		if (loadedExplanationPageIndex !== answerResult.pageIndex) {
			void refreshExplanationForPage(answerResult.pageIndex);
		}
	}

	function handleBackClick() {
		setShowConfirmDialog(true);
	}

	async function handleConfirmBack() {
		setIsDeleting(true);
		try {
			// Delete the session
			await deleteSessionMutation.mutateAsync();
			setShowConfirmDialog(false);
			// Navigate to dashboard
			router.navigate({ to: `/dashboard` });
		} catch (error) {
			console.error("Error deleting session:", error);
			setIsDeleting(false);
		}
	}

	function handleCancelBack() {
		setShowConfirmDialog(false);
	}

	function renderPage(page: NonNullable<typeof currentPage>) {
		const { content, type } = page.content;
		console.log("Rendering page:", { type, content });
		switch (type) {
			case "teach_and_explain_content":
				return (
					<TeachContent
						key={displayedPageIndex}
						{...content}
						// imageUrl={imageUrl}
						onContinue={handleContentContinue}
					/>
				);

			case "example_uses":
				return (
					<ExampleUses
						key={displayedPageIndex}
						{...content}
						// imageUrl={imageUrl}
						onContinue={handleContentContinue}
					/>
				);

			case "quiz":
				return (
					<Quiz
						key={displayedPageIndex}
						{...content}
						// imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
					/>
				);

			case "true_false":
				return (
					<TrueFalse
						key={displayedPageIndex}
						{...content}
						// imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
					/>
				);

			case "fill_in_the_blanks":
				return (
					<FillInTheBlanks
						key={displayedPageIndex}
						{...content}
						//imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
					/>
				);

			case "matching":
				return (
					<Matching
						key={displayedPageIndex}
						{...content}
						// imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
					/>
				);

			case "identify_object_from_images":
				return (
					// <IdentifyObjectFromImages
					// 	{...content}
					// 	onSubmit={handleAnswerSubmit}
					// />
					<IdentifyObjectFromImages
						key={displayedPageIndex}
						{...content}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
					/>
				);

			case "identify_shown_object_in_image":
				return (
					<IdentifyShownObjectInImage
						key={displayedPageIndex}
						{...content}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
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
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8 pb-[calc(env(safe-area-inset-bottom)+8rem)]">
			{isExplanationOpen && (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center">
					<button
						type="button"
						className="absolute inset-0"
						onClick={() => setIsExplanationOpen(false)}
						aria-label="Close explanation"
					/>
					<div className="relative z-10 w-full max-w-xl rounded-t-3xl border border-gray-700 bg-linear-to-br from-gray-800 to-gray-900 p-6 shadow-2xl sm:rounded-3xl sm:p-7">
						<div className="mb-5 flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
									Answer explanation
								</p>
								<h2 className="mt-2 text-2xl font-bold text-white">
									Why this answer was{" "}
									{answerResult?.correct ? "correct" : "incorrect"}
								</h2>
							</div>
							<button
								type="button"
								onClick={() => setIsExplanationOpen(false)}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xl text-gray-300 transition hover:bg-white/10"
								aria-label="Close explanation"
							>
								×
							</button>
						</div>

						{isExplanationLoadingForCurrentAnswer ? (
							<div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
								<div className="mb-3 h-5 w-40 animate-pulse rounded bg-blue-400/20" />
								<div className="space-y-2">
									<div className="h-4 w-full animate-pulse rounded bg-gray-700" />
									<div className="h-4 w-11/12 animate-pulse rounded bg-gray-700" />
									<div className="h-4 w-4/5 animate-pulse rounded bg-gray-700" />
								</div>
								<p className="mt-4 text-sm text-gray-300">
									Preparing your explanation...
								</p>
							</div>
						) : isExplanationReady ? (
							<div className="space-y-4">
								<div className="rounded-2xl border border-gray-700 bg-gray-950/30 p-5">
									<p className="text-base leading-7 text-gray-100">
										{explanationContent?.explanation}
									</p>
								</div>
								<div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
										Key takeaway
									</p>
									<p className="mt-2 text-sm leading-6 text-emerald-50">
										{explanationContent?.keyTakeaway}
									</p>
								</div>
							</div>
						) : isExplanationErrorForCurrentAnswer ? (
							<div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
								<p className="font-semibold text-red-300">
									We could not load the explanation right now.
								</p>
								<Button
									onClick={() =>
										answerResult
											? refreshExplanationForPage(answerResult.pageIndex)
											: Promise.resolve()
									}
									className="mt-4"
								>
									Try Again
								</Button>
							</div>
						) : null}

						<div className="mt-6 flex justify-end">
							<Button onClick={() => setIsExplanationOpen(false)}>
								Got it
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Confirmation Dialog */}
			{showConfirmDialog && (
				<div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md shadow-2xl border border-gray-700 animate-in fade-in zoom-in-95 duration-300">
						<div className="mb-6">
							<h2 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
								Leave Chapter?
							</h2>
							<div className="h-1 w-12 bg-linear-to-r from-blue-500 to-purple-500 rounded-full" />
						</div>
						<p className="text-gray-300 mb-8 leading-relaxed">
							If you go back, your progress in this chapter will be reset.
							You'll start from question 1 next time.
						</p>
						<div className="flex gap-3">
							<Button
								onClick={handleCancelBack}
								className="flex-1 bg-gray-700/50 hover:bg-gray-600 backdrop-blur-sm border border-gray-600 transition-all duration-200"
								disabled={isDeleting}
							>
								No, Stay
							</Button>
							<Button
								onClick={handleConfirmBack}
								className="flex-1 bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all duration-200 shadow-lg"
								disabled={isDeleting}
							>
								{isDeleting ? "Resetting..." : "Yes, Go Back"}
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="max-w-4xl mx-auto pb-12">
				{/* Header */}
				<Button onClick={handleBackClick} variant="secondary" className="mb-6">
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
								{displayedPageIndex + 1} / {totalPages}
							</span>
						</div>
						<div className="w-full bg-gray-700 rounded-full h-3">
							<div
								className="bg-linear-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
								style={{
									width: `${((displayedPageIndex + 1) / totalPages) * 100}%`,
								}}
							/>
						</div>
					</div>
				)}

				{/* Content */}
				{session ? (
					<div className="bg-gray-800 rounded-xl p-6 pb-[calc(env(safe-area-inset-bottom)+7rem)] shadow-lg">
						{isComplete ? (
							<CompletionScreen
								correctCount={completionReport?.correct ?? 0}
								incorrectCount={completionReport?.incorrect ?? 0}
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
				) : (
					"creating session"
				)}
			</div>

			{answerResult && !isComplete && (
				<div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 px-6">
					<div className="mx-auto max-w-4xl">
						<Button
							onClick={handleOpenExplanation}
							className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl"
						>
							{isExplanationLoadingForCurrentAnswer
								? "Preparing explanation..."
								: "View explanation"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

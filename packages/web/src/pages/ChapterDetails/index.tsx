import {
	ChapterNotReadyError,
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
	const [showChapterDetails, setShowChapterDetails] = useState(false);
	const deleteSessionMutation = useChapterGameSessionDelete();
	const answerExplanation = useAnswerExplanation();

	function handleCancelBack() {
		setShowConfirmDialog(false);
	}

	async function handleConfirmBack() {
		setIsDeleting(true);
		try {
			await deleteSessionMutation.mutateAsync();
			router.navigate({ to: `/dashboard` });
		} finally {
			setIsDeleting(false);
			setShowConfirmDialog(false);
		}
	}

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
	const {
		data: pagesData,
		isLoading: pagesLoading,
		isError: pagesError,
		error: pagesErrorObj,
		isFetching: pagesFetching,
	} = useChapterPages({ chapterId });

	const pagesReady = !!(pagesData?.pages?.length);

	const { data: session, isLoading: sessionLoading } = useChapterGameSession({
		chapterId,
		enabled: pagesReady,
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

	const isChapterPreparing =
		!!pagesError && pagesErrorObj instanceof ChapterNotReadyError;
	const isLoading =
		courseLoading ||
		chaptersLoading ||
		pagesLoading ||
		sessionLoading ||
		(isChapterPreparing && pagesFetching);

	if (isLoading || isChapterPreparing) {
		return (
			<div className="min-h-screen bg-landing-hero-bg dark:bg-dark-bg flex items-center justify-center px-6 py-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-landing-hero-text dark:border-dark-accent mx-auto mb-4" />
					<p className="text-landing-hero-text/80 dark:text-dark-muted font-montserrat">
						{isChapterPreparing
							? "Chapter is being prepared. Retrying in 10 seconds..."
							: "Loading chapter..."}
					</p>
				</div>
			</div>
		);
	}

	const currentChapter = chaptersData?.chapters.find(
		(ch) => ch.id === chapterId,
	);

	if (!course || !chaptersData || !pagesData || !currentChapter) {
		return (
			<div className="min-h-screen bg-landing-hero-bg dark:bg-dark-bg px-6 py-8">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-3xl font-bold text-landing-hero-text dark:text-dark-text font-tusker mb-4">Chapter Not Found</h1>
					<p className="text-landing-hero-text/80 dark:text-dark-muted font-montserrat mb-8">
						The chapter you're looking for doesn't exist.
					</p>
					<button
						type="button"
						onClick={() => router.navigate({ to: "/dashboard" })}
						className="rounded-xl bg-white dark:bg-dark-card px-6 py-3 font-semibold text-gray-800 dark:text-dark-text shadow-md hover:bg-gray-50 dark:hover:bg-dark-surface font-montserrat"
					>
						← Go Home
					</button>
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
			const result = await submitAnswer.mutateAsync({ answer });
			if (typeof result?.correct === "boolean") {
				setAnswerResult({
					correct: result.correct,
					pageIndex: submittedPageIndex,
				});
				// Explanation is fetched only when user clicks "View Explanation"
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
						onViewExplanation={handleOpenExplanation}
						isExplanationLoading={isExplanationLoadingForCurrentAnswer}
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
						onViewExplanation={handleOpenExplanation}
						isExplanationLoading={isExplanationLoadingForCurrentAnswer}
					/>
				);

			case "fill_in_the_blanks":
				return (
					<FillInTheBlanks
						key={displayedPageIndex}
						{...content}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
						onViewExplanation={handleOpenExplanation}
						isExplanationLoading={isExplanationLoadingForCurrentAnswer}
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
						onViewExplanation={handleOpenExplanation}
						isExplanationLoading={isExplanationLoadingForCurrentAnswer}
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
						onViewExplanation={handleOpenExplanation}
						isExplanationLoading={isExplanationLoadingForCurrentAnswer}
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
						onViewExplanation={handleOpenExplanation}
						isExplanationLoading={isExplanationLoadingForCurrentAnswer}
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
		<div className="min-h-screen bg-landing-hero-bg dark:bg-dark-bg px-4 py-6 sm:px-6 sm:py-8">
			{isExplanationOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
					<button
						type="button"
						className="absolute inset-0"
						onClick={() => setIsExplanationOpen(false)}
						aria-label="Close explanation"
					/>
					<div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl bg-white dark:bg-dark-card shadow-xl">
						<div className="p-6 sm:p-8">
							<div className="mb-6 flex items-start justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-muted font-tusker">
										Answer explanation
									</p>
									<h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker sm:text-3xl">
										Why this answer was{" "}
										{answerResult?.correct ? "correct" : "incorrect"}
									</h2>
									<p className="mt-2 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat sm:text-base">
										Quick review before you move to the next question.
									</p>
								</div>
								<button
									type="button"
									onClick={() => setIsExplanationOpen(false)}
									className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-dark-surface text-xl text-gray-600 dark:text-dark-muted transition hover:bg-gray-200 dark:hover:bg-dark-border font-montserrat"
									aria-label="Close explanation"
								>
									×
								</button>
							</div>

							{isExplanationLoadingForCurrentAnswer ? (
								<div className="rounded-xl bg-gray-50 dark:bg-dark-surface p-6">
									<div className="mb-4 flex items-center gap-3">
										<div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-dark-border" />
										<div className="h-5 w-44 animate-pulse rounded-full bg-gray-200 dark:bg-dark-border" />
									</div>
									<div className="space-y-2">
										<div className="h-4 w-full animate-pulse rounded-full bg-gray-200 dark:bg-dark-border" />
										<div className="h-4 w-11/12 animate-pulse rounded-full bg-gray-200 dark:bg-dark-border" />
										<div className="h-4 w-4/5 animate-pulse rounded-full bg-gray-200 dark:bg-dark-border" />
									</div>
									<p className="mt-5 text-sm font-medium text-gray-600 dark:text-dark-muted font-montserrat">
										Preparing your explanation...
									</p>
								</div>
							) : isExplanationReady ? (
								<div className="space-y-4">
									<div className="rounded-xl bg-gray-50 dark:bg-dark-surface p-6">
										<p className="mb-3 inline-flex rounded-lg bg-gray-200 dark:bg-dark-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-muted font-tusker">
											Breakdown
										</p>
										<p className="text-base leading-8 text-gray-800 dark:text-dark-text font-montserrat sm:text-lg">
											{explanationContent?.explanation}
										</p>
									</div>
									<div className="rounded-xl bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30 p-6">
										<p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 font-tusker">
											Key takeaway
										</p>
										<p className="mt-3 text-sm leading-7 text-gray-800 dark:text-dark-text font-montserrat sm:text-base">
											{explanationContent?.keyTakeaway}
										</p>
									</div>
								</div>
							) : isExplanationErrorForCurrentAnswer ? (
								<div className="rounded-xl bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30 p-6">
									<p className="font-semibold text-red-700 dark:text-red-400 font-montserrat">
										We could not load the explanation right now.
									</p>
									<button
										type="button"
										onClick={() =>
											answerResult
												? void refreshExplanationForPage(answerResult.pageIndex)
												: undefined
										}
										className="mt-4 rounded-xl bg-gray-800 dark:bg-dark-accent px-4 py-2 font-semibold text-white hover:bg-gray-700 dark:hover:opacity-90 font-montserrat"
									>
										Try Again
									</button>
								</div>
							) : null}

							<div className="mt-6 flex justify-end">
								<button
									type="button"
									onClick={() => setIsExplanationOpen(false)}
									className="rounded-xl bg-landing-button-primary dark:bg-dark-accent px-5 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat"
								>
									Got it
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Confirmation Dialog */}
			{showConfirmDialog && (
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
					<div className="bg-white dark:bg-dark-card rounded-xl p-8 max-w-md shadow-xl w-full">
						<div className="mb-6">
							<h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker mb-2">
								Leave Chapter?
							</h2>
						</div>
						<p className="text-gray-600 dark:text-dark-muted mb-8 leading-relaxed font-montserrat">
							If you go back, your progress in this chapter will be reset.
							You'll start from question 1 next time.
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleCancelBack}
								disabled={isDeleting}
								className="flex-1 rounded-xl bg-gray-100 dark:bg-dark-surface px-4 py-3 font-semibold text-gray-800 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border transition-colors disabled:opacity-50 font-montserrat"
							>
								No, Stay
							</button>
							<button
								type="button"
								onClick={handleConfirmBack}
								disabled={isDeleting}
								className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 font-montserrat"
							>
								{isDeleting ? "Resetting..." : "Yes, Go Back"}
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="mx-auto max-w-4xl pb-16">
				{/* Header */}
				<button
					type="button"
					onClick={handleBackClick}
					className="mb-6 rounded-xl bg-white dark:bg-dark-card px-4 py-3 font-semibold text-gray-800 dark:text-dark-text shadow-md hover:bg-gray-50 dark:hover:bg-dark-surface font-montserrat"
				>
					← Back to Chapters
				</button>

				{/* Chapter header + progress (collapsible) */}
				<button
					type="button"
					onClick={() => setShowChapterDetails((v) => !v)}
					className="mb-6 w-full rounded-xl bg-white dark:bg-dark-card px-4 py-3 shadow-md text-left hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
				>
					{/* Progress bar - always visible when not complete */}
					{!isComplete ? (
						<div className="flex items-center gap-3">
							<div className="flex-1 min-w-0">
								<div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
									<div
										className="h-full rounded-full bg-landing-button-primary dark:bg-dark-accent transition-all duration-500"
										style={{
											width: `${((displayedPageIndex + 1) / totalPages) * 100}%`,
										}}
									/>
								</div>
							</div>
							<span className="text-sm font-semibold text-gray-700 dark:text-dark-muted tabular-nums shrink-0">
								{displayedPageIndex + 1}/{totalPages}
							</span>
							<span className="text-gray-400 dark:text-dark-muted shrink-0" aria-hidden>
								{showChapterDetails ? "▲" : "▼"}
							</span>
						</div>
					) : (
						<div className="flex items-center justify-between">
							<span className="text-sm font-semibold text-gray-600 dark:text-dark-muted font-montserrat">Chapter complete</span>
							<span className="text-gray-400 dark:text-dark-muted shrink-0" aria-hidden>
								{showChapterDetails ? "▲" : "▼"}
							</span>
						</div>
					)}
					{/* Chapter details - shown when expanded */}
					{showChapterDetails && (
						<div className={`pt-4 border-t border-gray-100 dark:border-dark-border ${!isComplete ? "mt-4" : "mt-3"}`}>
							<p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-muted font-tusker">
								{course.title}
							</p>
							<h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-dark-text font-tusker">
								{currentChapter.title}
							</h1>
							{currentChapter.description && (
								<p className="mt-2 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat line-clamp-3">
									{currentChapter.description}
								</p>
							)}
						</div>
					)}
				</button>

				{/* Content */}
				{session ? (
					<div className="rounded-xl bg-white dark:bg-dark-card p-5 shadow-md sm:p-6">
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
								<p className="text-gray-400 dark:text-dark-muted">No content available</p>
							</div>
						)}
					</div>
				) : (
					"creating session"
				)}
			</div>
		</div>
	);
}

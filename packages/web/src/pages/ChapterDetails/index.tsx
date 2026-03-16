import {
	useAnswerExplanation,
	useChapterGameAnswer,
	useChapterGameSession,
	useChapterGameSessionDelete,
	useChapterPages,
	useCourseById,
	useCourseChaptersByCourseId,
	useJobStatus,
} from "@pantha/react/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MathText } from "../../shared/components/MathText";
import { useParticles } from "../../shared/components/Particles";
import { useHapticFeedback } from "../../shared/utils/haptics";
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
	const hapticFeedback = useHapticFeedback();
	const particles = useParticles();

	const [completionReport, setCompletionReport] = useState<{
		correct: number;
		incorrect: number;
		xpEarned: number;
	} | null>(null);
	const [pendingCompletionReport, setPendingCompletionReport] = useState<{
		correct: number;
		incorrect: number;
		xpEarned: number;
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
	const queryClient = useQueryClient();

	const { data: pagesData, isLoading: pagesLoading } = useChapterPages({
		chapterId,
	});

	// When server is still preparing pages it returns { jobId } (202)
	const preparingJobId =
		pagesData && "jobId" in pagesData ? pagesData.jobId : undefined;
	const pagesReady =
		!!pagesData && "pages" in pagesData && !!pagesData.pages?.length;

	const jobStatus = useJobStatus({ jobId: preparingJobId });
	const isJobPending = !!preparingJobId && jobStatus.data?.state !== "success";

	// Once the preparation job succeeds, refetch pages
	useEffect(() => {
		if (preparingJobId && jobStatus.data?.state === "success") {
			queryClient.invalidateQueries({ queryKey: ["chapterPages", chapterId] });
		}
	}, [preparingJobId, jobStatus.data?.state, queryClient, chapterId]);

	useEffect(() => {
		if (isExplanationOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
	}, [isExplanationOpen]);

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

	const isLoading =
		courseLoading ||
		chaptersLoading ||
		pagesLoading ||
		sessionLoading ||
		isJobPending;

	if (isLoading) {
		return (
			<div className="min-h-screen bg-landing-hero-bg dark:bg-dark-bg flex items-center justify-center px-6 py-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-landing-hero-text dark:border-dark-accent mx-auto mb-4" />
					<p className="text-landing-hero-text/80 dark:text-dark-muted font-montserrat">
						{isJobPending
							? "Chapter is being prepared..."
							: "Loading chapter..."}
					</p>
				</div>
			</div>
		);
	}

	const currentChapter = chaptersData?.chapters.find(
		(ch) => ch.id === chapterId,
	);

	if (
		!course ||
		!chaptersData ||
		!pagesData ||
		!("pages" in pagesData) ||
		!currentChapter
	) {
		return (
			<div className="min-h-screen bg-landing-hero-bg dark:bg-dark-bg px-6 py-8">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-3xl font-bold text-landing-hero-text dark:text-dark-text font-tusker mb-4">
						Chapter Not Found
					</h1>
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
	// pagesData is narrowed to have `pages` after the guard above
	const narrowedData = pagesData as Extract<
		typeof pagesData,
		{ pages: unknown[] }
	>;
	const pages = narrowedData.pages;
	const imagesMap = narrowedData.images as
		| Record<string, { url: string } | { images: { url: string }[] }>
		| undefined;
	const totalPages = pages.length;
	console.log("pages length", totalPages);
	const displayedPageIndex = answerResult?.pageIndex ?? currentPageIndex;
	const currentPage = pages[displayedPageIndex];
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
				const cx = window.innerWidth / 2;
				const cy = window.innerHeight / 2;
				if (result.correct) {
					hapticFeedback.success();
					particles.create(
						cx,
						cy,
						[
							{ emoji: "🎉", canFlip: false },
							{ emoji: "⭐", canFlip: false },
							{ emoji: "💪", canFlip: false },
							{ emoji: "🌟", canFlip: false },
						],
						300,
					);
				} else {
					hapticFeedback.error();
					particles.create(
						cx,
						cy,
						[
							{ emoji: "💔", canFlip: false },
							{ emoji: "😵", canFlip: true },
							{ emoji: "👎", canFlip: false },
						],
						250,
					);
				}
				setAnswerResult({
					correct: result.correct,
					pageIndex: submittedPageIndex,
				});
				// Explanation is fetched only when user clicks "View Explanation"
			}

			if (result?.complete) {
				// Only celebrate with particles when the last answer was correct
				// Otherwise the celebration emojis drown out the error feedback
				if (result.correct) {
					hapticFeedback.success();
					particles.create(
						window.innerWidth / 2,
						window.innerHeight / 2,
						[
							{ emoji: "🎉", canFlip: false },
							{ emoji: "🏆", canFlip: false },
							{ emoji: "🔥", canFlip: false },
							{ emoji: "⭐", canFlip: false },
						],
						800,
					);
				}
				setPendingCompletionReport({
					correct: result.report?.correct ?? 0,
					incorrect:
						(result.report?.total ?? 0) - (result.report?.correct ?? 0),
					xpEarned: result.report?.xp ?? 0,
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
		hapticFeedback.tap();

		try {
			const result = await submitAnswer.mutateAsync({ answer: ["continue"] });

			if (result?.complete) {
				setCompletionReport({
					correct: result.report?.correct ?? 0,
					incorrect:
						(result.report?.total ?? 0) - (result.report?.correct ?? 0),
					xpEarned: result.report?.xp ?? 0,
				});
			}
		} catch (error) {
			console.error("Error continuing content:", error);
		}
	}

	function handleAnswerContinue() {
		hapticFeedback.tap();
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

		hapticFeedback.tap();
		setIsExplanationOpen(true);

		if (loadedExplanationPageIndex !== answerResult.pageIndex) {
			void refreshExplanationForPage(answerResult.pageIndex);
		}
	}

	function handleBackClick() {
		hapticFeedback.tap();
		setShowConfirmDialog(true);
	}

	async function handleCompletionBack() {
		hapticFeedback.tap();
		setIsDeleting(true);
		try {
			await deleteSessionMutation.mutateAsync();
			router.navigate({ to: `/dashboard` });
		} finally {
			setIsDeleting(false);
		}
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

			case "identify_object_from_images": {
				const imgData = imagesMap?.[page.id];
				const imageUrls =
					imgData && "images" in imgData
						? imgData.images.map((i) => i.url)
						: undefined;
				return (
					<IdentifyObjectFromImages
						key={displayedPageIndex}
						{...content}
						imageUrls={imageUrls}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
						onViewExplanation={handleOpenExplanation}
						isExplanationLoading={isExplanationLoadingForCurrentAnswer}
					/>
				);
			}

			case "identify_shown_object_in_image": {
				const imgData = imagesMap?.[page.id];
				const imageUrl = imgData && "url" in imgData ? imgData.url : undefined;
				return (
					<IdentifyShownObjectInImage
						key={displayedPageIndex}
						{...content}
						imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
						answerResult={answerResult}
						onContinue={handleAnswerContinue}
						onViewExplanation={handleOpenExplanation}
						isExplanationLoading={isExplanationLoadingForCurrentAnswer}
					/>
				);
			}

			default:
				return (
					<div className="text-center p-8">
						<p className="text-red-400">Unsupported content type</p>
					</div>
				);
		}
	}

	return (
		<div className="min-h-screen bg-landing-hero-bg dark:bg-dark-bg flex flex-col">
			{isExplanationOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
					<button
						type="button"
						className="absolute inset-0"
						onClick={() => setIsExplanationOpen(false)}
						aria-label="Close explanation"
					/>
					<div className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-3rem)] flex flex-col rounded-xl bg-white dark:bg-dark-card shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-dark-border p-6 sm:p-8">
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
								className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-dark-surface text-xl text-gray-600 dark:text-dark-muted transition hover:bg-gray-200 dark:hover:bg-dark-border font-montserrat"
								aria-label="Close explanation"
							>
								×
							</button>
						</div>

						{/* Scrollable Content */}
						<div className="overflow-y-auto flex-1 p-6 sm:p-8">
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
										{explanationContent?.explanation && (
											<MathText
												block
												className="text-base leading-8 text-gray-800 dark:text-dark-text font-montserrat sm:text-lg"
											>
												{explanationContent.explanation}
											</MathText>
										)}
									</div>
									<div className="rounded-xl bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30 p-6">
										<p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 font-tusker">
											Key takeaway
										</p>
										{explanationContent?.keyTakeaway && (
											<MathText
												block
												className="mt-3 text-sm leading-7 text-gray-800 dark:text-dark-text font-montserrat sm:text-base"
											>
												{explanationContent.keyTakeaway}
											</MathText>
										)}
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
						</div>

						{/* Footer with Button */}
						<div className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-8 flex justify-end">
							<button
								type="button"
								onClick={() => {
									hapticFeedback.tap();
									setIsExplanationOpen(false);
								}}
								className="rounded-xl bg-landing-button-primary dark:bg-dark-accent px-5 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat"
							>
								Got it
							</button>
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

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
					{/* Header */}
					<button
						type="button"
						onClick={handleBackClick}
						className="mb-8 inline-flex items-center gap-2 text-gray-700 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text transition-colors font-montserrat"
					>
						<span>←</span>
						<span>Back to Chapters</span>
					</button>

					{/* Chapter header + progress (collapsible) */}
					<button
						type="button"
						onClick={() => setShowChapterDetails((v) => !v)}
						className="mb-8 w-full text-left"
					>
						{/* Progress bar - always visible when not complete */}
						{!isComplete ? (
							<div className="space-y-3">
								<div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
									<div
										className="h-full rounded-full bg-landing-button-primary dark:bg-dark-accent transition-all duration-500"
										style={{
											width: `${((displayedPageIndex + 1) / totalPages) * 100}%`,
										}}
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold text-gray-700 dark:text-dark-muted tabular-nums">
										{displayedPageIndex + 1}/{totalPages}
									</span>
									<span
										className="text-gray-400 dark:text-dark-muted text-sm"
										aria-hidden
									>
										{showChapterDetails ? "▲" : "▼"}
									</span>
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-semibold text-gray-600 dark:text-dark-muted font-montserrat">
									Chapter complete
								</span>
								<span
									className="text-gray-400 dark:text-dark-muted text-sm"
									aria-hidden
								>
									{showChapterDetails ? "▲" : "▼"}
								</span>
							</div>
						)}
						{/* Chapter details - shown when expanded */}
						{showChapterDetails && (
							<div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-border">
								<p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-muted font-tusker">
									{course.title}
								</p>
								<h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-text font-tusker">
									{currentChapter.title}
								</h1>
								{currentChapter.description && (
									<p className="mt-3 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
										{currentChapter.description}
									</p>
								)}
							</div>
						)}
					</button>

					{/* Content */}
					{session ? (
						<div>
							{isComplete ? (
								<CompletionScreen
									correctCount={completionReport?.correct ?? 0}
									incorrectCount={completionReport?.incorrect ?? 0}
									totalPages={totalPages}
									xpEarned={completionReport?.xpEarned ?? 0}
									onBackClick={handleCompletionBack}
								/>
							) : currentPage ? (
								renderPage(currentPage)
							) : (
								<div className="text-center p-8">
									<p className="text-gray-400 dark:text-dark-muted">
										No content available
									</p>
								</div>
							)}
						</div>
					) : (
						<div className="text-center p-8">
							<p className="text-gray-400 dark:text-dark-muted">
								Creating session...
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Fixed Bottom Button Area */}
			{!isComplete && session && currentPage && (
				<div className="h-24 sm:h-20"></div>
			)}
		</div>
	);
}

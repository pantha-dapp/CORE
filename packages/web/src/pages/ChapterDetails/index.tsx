import {
	useAnswerExplanation,
	useChapterGameAnswer,
	useChapterGameSession,
	useChapterGameSessionDelete,
	useChapterPages,
	useCourseById,
	useCourseChaptersByCourseId,
	useFeedPost,
	useJobStatus,
} from "@pantha/react/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MathText } from "../../shared/components/MathText";
import { useParticles } from "../../shared/components/Particles";
import { ShareToFeedModal } from "../../shared/components/ShareToFeedModal";
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
	const [pendingShareChapter, setPendingShareChapter] = useState(false);
	const deleteSessionMutation = useChapterGameSessionDelete();
	const answerExplanation = useAnswerExplanation();
	const feedPost = useFeedPost();

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
	const isJobFailed = jobStatus.data?.state === "failed";
	const isJobPending =
		!!preparingJobId && !isJobFailed && jobStatus.data?.state !== "success";

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

	const isLoading =
		courseLoading ||
		chaptersLoading ||
		pagesLoading ||
		sessionLoading ||
		isJobPending;

	if (isLoading) {
		return (
			<div className="min-h-screen dark:bg-dark-bg flex items-center justify-center px-6 py-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-accent mx-auto mb-4" />
					<p className="text-dark-muted font-titillium">
						{isJobPending
							? "Chapter is being prepared..."
							: "Loading chapter..."}
					</p>
				</div>
			</div>
		);
	}

	if (isJobFailed) {
		return (
			<div className="min-h-screen dark:bg-dark-bg px-6 py-8 flex items-center justify-center">
				<div className="max-w-md mx-auto text-center">
					<h1 className="text-2xl font-bold text-dark-text font-titillium mb-3">
						Chapter Preparation Failed
					</h1>
					<p className="text-dark-muted font-titillium mb-6">
						We could not generate chapter content in time. Please retry.
					</p>
					<div className="flex items-center justify-center gap-3">
						<button
							type="button"
							onClick={() =>
								queryClient.invalidateQueries({
									queryKey: ["chapterPages", chapterId],
								})
							}
							className="rounded-lg bg-dark-accent px-4 py-2 font-semibold text-dark-bg hover:bg-dark-accent/90 transition-colors font-titillium"
						>
							Retry
						</button>
						<button
							type="button"
							onClick={() => router.navigate({ to: "/dashboard" })}
							className="rounded-lg bg-dark-card border border-dark-border px-4 py-2 font-semibold text-dark-text hover:bg-dark-surface transition-colors font-titillium"
						>
							Go Home
						</button>
					</div>
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
			<div className="min-h-screen dark:bg-dark-bg px-6 py-8 flex items-center justify-center">
				<div className="max-w-md mx-auto text-center">
					<h1 className="text-2xl font-bold text-dark-text font-titillium mb-3">
						Chapter Not Found
					</h1>
					<p className="text-dark-muted font-titillium mb-6">
						The chapter you're looking for doesn't exist.
					</p>
					<button
						type="button"
						onClick={() => router.navigate({ to: "/dashboard" })}
						className="rounded-lg bg-dark-card border border-dark-border px-4 py-2 font-semibold text-dark-text hover:bg-dark-surface transition-colors font-titillium"
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
				if (chapterId) setPendingShareChapter(true);
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
				if (chapterId) setPendingShareChapter(true);
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
		<>
			<div className="min-h-screen dark:bg-dark-bg flex flex-col relative">
				{/* Gradient background */}
				<div
					className="fixed inset-0 pointer-events-none animate-gradient-bg -z-10"
					aria-hidden
					style={{
						background:
							"radial-gradient(ellipse 80% 50% at 50% 15%, rgba(30, 44, 72, 0.4) 0%, transparent 50%), radial-gradient(ellipse 60% 80% at 80% 55%, rgba(129, 140, 248, 0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 60% at 20% 90%, rgba(129, 140, 248, 0.06) 0%, transparent 50%)",
					}}
				/>
				{isExplanationOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
						<button
							type="button"
							className="absolute inset-0"
							onClick={() => setIsExplanationOpen(false)}
							aria-label="Close explanation"
						/>
						<div className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl bg-dark-card/95 backdrop-blur-xl border border-dark-border/50 shadow-2xl overflow-hidden animate-chapter-modal-in">
							{/* Header */}
							<div className="flex items-start justify-between gap-4 border-b border-dark-border p-4 sm:p-5">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-wider text-dark-muted font-titillium">
										Answer explanation
									</p>
									<h2 className="mt-1.5 text-xl font-bold text-dark-text font-titillium sm:text-2xl">
										Why this answer was{" "}
										{answerResult?.correct ? "correct" : "incorrect"}
									</h2>
									<p className="mt-1 text-sm text-dark-muted font-titillium">
										Quick review before you move to the next question.
									</p>
								</div>
								<button
									type="button"
									onClick={() => setIsExplanationOpen(false)}
									className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dark-surface text-dark-muted transition hover:bg-dark-border font-titillium btn-press-zoom"
									aria-label="Close explanation"
								>
									×
								</button>
							</div>

							{/* Scrollable Content */}
							<div className="overflow-y-auto flex-1 p-4 sm:p-5">
								{isExplanationLoadingForCurrentAnswer ? (
									<div className="rounded-xl bg-dark-surface p-5">
										<div className="mb-3 flex items-center gap-3">
											<div className="h-9 w-9 animate-pulse rounded-lg bg-dark-border" />
											<div className="h-4 w-36 animate-pulse rounded-full bg-dark-border" />
										</div>
										<div className="space-y-2">
											<div className="h-3 w-full animate-pulse rounded-full bg-dark-border" />
											<div className="h-3 w-11/12 animate-pulse rounded-full bg-dark-border" />
											<div className="h-3 w-4/5 animate-pulse rounded-full bg-dark-border" />
										</div>
										<p className="mt-4 text-sm text-dark-muted font-titillium">
											Preparing your explanation...
										</p>
									</div>
								) : isExplanationReady ? (
									<div className="space-y-3">
										<div className="rounded-xl bg-dark-surface p-4 animate-chapter-result-in">
											<p className="mb-2 inline-flex rounded-lg bg-dark-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dark-muted font-titillium">
												Breakdown
											</p>
											{explanationContent?.explanation && (
												<MathText
													block
													className="text-sm leading-7 text-dark-text font-titillium sm:text-base"
												>
													{explanationContent.explanation}
												</MathText>
											)}
										</div>
										<div className="rounded-xl bg-dark-success/10 border border-dark-success/30 p-4">
											<p className="text-[10px] font-semibold uppercase tracking-wider text-dark-success font-titillium">
												Key takeaway
											</p>
											{explanationContent?.keyTakeaway && (
												<MathText
													block
													className="mt-2 text-sm leading-7 text-dark-text font-titillium"
												>
													{explanationContent.keyTakeaway}
												</MathText>
											)}
										</div>
									</div>
								) : isExplanationErrorForCurrentAnswer ? (
									<div className="rounded-xl bg-red-900/20 border border-red-500/30 p-4">
										<p className="font-semibold text-red-400 font-titillium">
											We could not load the explanation right now.
										</p>
										<button
											type="button"
											onClick={() =>
												answerResult
													? void refreshExplanationForPage(
															answerResult.pageIndex,
														)
													: undefined
											}
											className="mt-3 rounded-lg bg-dark-accent px-3 py-2 text-sm font-semibold text-dark-bg hover:opacity-90 font-titillium"
										>
											Try Again
										</button>
									</div>
								) : null}
							</div>

							{/* Footer with Button */}
							<div className="border-t border-dark-border bg-dark-card p-4 sm:p-5 flex justify-end">
								<button
									type="button"
									onClick={() => {
										hapticFeedback.tap();
										setIsExplanationOpen(false);
									}}
									className="rounded-lg bg-dark-accent px-4 py-2 text-sm font-semibold text-dark-bg hover:opacity-90 font-titillium"
								>
									Got it
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Confirmation Dialog */}
				{showConfirmDialog && (
					<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
						<div className="bg-dark-card border border-dark-border rounded-2xl p-5 max-w-md shadow-2xl w-full animate-chapter-modal-in">
							<h2 className="text-xl font-bold text-dark-text font-titillium mb-2">
								Leave Chapter?
							</h2>
							<p className="text-dark-muted text-sm leading-relaxed font-titillium mb-6">
								If you go back, your progress in this chapter will be reset.
								You'll start from question 1 next time.
							</p>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleCancelBack}
									disabled={isDeleting}
									className="flex-1 rounded-lg bg-dark-surface px-3 py-2 text-sm font-semibold text-dark-text hover:bg-dark-border transition-colors disabled:opacity-50 font-titillium"
								>
									No, Stay
								</button>
								<button
									type="button"
									onClick={handleConfirmBack}
									disabled={isDeleting}
									className="flex-1 rounded-lg bg-red-500/90 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50 font-titillium"
								>
									{isDeleting ? "Resetting..." : "Yes, Go Back"}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Main Content */}
				<div className="flex-1 min-h-0 overflow-y-auto pb-32">
					<div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
						{/* Header */}
						<button
							type="button"
							onClick={handleBackClick}
							className="mb-6 inline-flex items-center gap-2 text-dark-muted hover:text-dark-text transition-colors font-titillium text-sm animate-back-from-topleft btn-press-zoom"
						>
							<span>←</span>
							<span>Back to Chapters</span>
						</button>

						{/* Chapter header + progress (collapsible) */}
						<button
							type="button"
							onClick={() => setShowChapterDetails((v) => !v)}
							className="mb-6 w-full text-left"
						>
							{/* Progress bar - always visible when not complete */}
							{!isComplete ? (
								<div className="space-y-2">
									<div className="h-2 w-full rounded-full bg-dark-surface overflow-hidden">
										<div
											className="h-full rounded-full bg-dark-accent transition-all duration-500"
											style={{
												width: `${((displayedPageIndex + 1) / totalPages) * 100}%`,
											}}
										/>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-xs font-semibold text-dark-muted tabular-nums font-titillium">
											{displayedPageIndex + 1}/{totalPages}
										</span>
										<span className="text-dark-muted text-xs" aria-hidden>
											{showChapterDetails ? "▲" : "▼"}
										</span>
									</div>
								</div>
							) : (
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-semibold text-dark-muted font-titillium">
										Chapter complete
									</span>
									<span className="text-dark-muted text-sm" aria-hidden>
										{showChapterDetails ? "▲" : "▼"}
									</span>
								</div>
							)}
							{/* Chapter details - shown when expanded */}
							{showChapterDetails && (
								<div className="pt-4 mt-4 border-t border-dark-border">
									<p className="text-[10px] font-semibold uppercase tracking-wider text-dark-muted font-titillium">
										{course.title}
									</p>
									<h1 className="mt-2 text-xl font-bold tracking-tight text-dark-text font-titillium">
										{currentChapter.title}
									</h1>
									{currentChapter.description && (
										<p className="mt-2 text-sm leading-6 text-dark-muted font-titillium">
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
									<div>{renderPage(currentPage)}</div>
								) : (
									<div className="text-center p-8">
										<p className="text-dark-muted font-titillium">
											No content available
										</p>
									</div>
								)}
							</div>
						) : (
							<div className="text-center p-8">
								<p className="text-dark-muted font-titillium">
									Creating session...
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Fixed Bottom Button Area - spacer handled by pb-32 on scroll */}
			</div>

			{pendingShareChapter && (
				<ShareToFeedModal
					emoji="🎓"
					title="Chapter Complete!"
					description={`You finished "${currentChapter.title}". Share it with your friends?`}
					onConfirm={() => {
						if (chapterId)
							feedPost.mutate({ type: "chapter-completion", chapterId });
						setPendingShareChapter(false);
					}}
					onDismiss={() => setPendingShareChapter(false)}
					isLoading={feedPost.isPending}
				/>
			)}
		</>
	);
}

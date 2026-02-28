import {
	useChapterGameAnswer,
	useChapterGameSession,
	useChapterGameSessionDelete,
	useChapterPages,
	useCourseById,
	useCourseChaptersByCourseId,
} from "@pantha/react/hooks";
import { useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteSessionMutation = useChapterGameSessionDelete();

	// Swipe detection state
	const swipeStartX = useRef(0);
	const swipeStartY = useRef(0);
	const SWIPE_THRESHOLD = 30; // Reduced for mobile: minimum pixels to detect swipe
	const MAX_VERTICAL_DISTANCE = 80; // Maximum vertical movement allowed
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
	useEffect(() => {
		const handlePointerDown = (e: PointerEvent) => {
			swipeStartX.current = e.clientX;
			swipeStartY.current = e.clientY;
			console.log("Pointer Down:", { x: e.clientX, y: e.clientY });
		};

		const handlePointerUp = (e: PointerEvent) => {
			const swipeEndX = e.clientX;
			const swipeEndY = e.clientY;

			// Calculate swipe distance
			// Negative = swiping right (go back gesture on mobile)
			// Positive = swiping left
			const swipeDistanceX = swipeStartX.current - swipeEndX;
			const swipeDistanceY = Math.abs(swipeStartY.current - swipeEndY);
			const absoluteSwipeX = Math.abs(swipeDistanceX);

			console.log("Pointer Up - Swipe Distances:", {
				swipeDistanceX: swipeDistanceX,
				absoluteSwipeX: absoluteSwipeX,
				verticalDistance: swipeDistanceY,
				startX: swipeStartX.current,
				startY: swipeStartY.current,
				endX: swipeEndX,
				endY: swipeEndY,
				threshold: SWIPE_THRESHOLD,
				maxVertical: MAX_VERTICAL_DISTANCE,
				direction: swipeDistanceX < 0 ? "RIGHT (Go Back)" : "LEFT",
			});

			// Support both:
			// - RIGHT swipe (negative value) = standard mobile back gesture
			// - LEFT swipe (positive value) = alternative gesture
			// The absolute value must be greater than threshold and vertical movement must be minimal
			const isValidSwipe =
				absoluteSwipeX > SWIPE_THRESHOLD &&
				swipeDistanceY < MAX_VERTICAL_DISTANCE;

			console.log("Is Valid Swipe?", isValidSwipe);

			if (isValidSwipe) {
				console.log("SWIPE DETECTED! Opening dialog...");
				handleBackClick();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("pointerup", handlePointerUp);

		console.log("Swipe detection listener attached");

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("pointerup", handlePointerUp);
			console.log("Swipe detection listener removed");
		};
	}, []);

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
	const currentPage = pagesData.pages[currentPageIndex];
	const isComplete =
		completionReport !== null || currentPageIndex >= totalPages;

	async function handleAnswerSubmit(answer: string[]) {
		try {
			const result = await submitAnswer.mutateAsync({ answer });
			if (result?.complete) {
				setCompletionReport({
					correct: result.report?.correct ?? 0,
					incorrect:
						(result.report?.total ?? 0) - (result.report?.correct ?? 0),
				});
			}
		} catch (error) {
			console.error("Error submitting answer:", error);
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

			case "fill_in_the_blanks":
				return (
					<FillInTheBlanks
						{...content}
						//imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
					/>
				);

			case "matching":
				return (
					<Matching
						{...content}
						// imageUrl={imageUrl}
						onSubmit={handleAnswerSubmit}
					/>
				);

			case "identify_object_from_images":
				return (
					// <IdentifyObjectFromImages
					// 	{...content}
					// 	onSubmit={handleAnswerSubmit}
					// />
					<IdentifyObjectFromImages
						{...content}
						onSubmit={handleAnswerSubmit}
					/>
				);

			case "identify_shown_object_in_image":
				return (
					<IdentifyShownObjectInImage
						{...content}
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
				{session ? (
					<div className="bg-gray-800 rounded-xl p-6 shadow-lg">
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
		</div>
	);
}

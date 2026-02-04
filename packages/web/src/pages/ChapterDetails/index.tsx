// import {
// 	useCourseById,
// 	useCourseChaptersByCourseId,
// 	useChapterPages,
// } from "@pantha/react/hooks";
// import { useParams, useRouter } from "@tanstack/react-router";
// import Button from "../../shared/components/Button";

// export default function chapterDetails() {
// 	const { courseId, chapterId } = useParams({ strict: false });
// 	const router = useRouter();

// 	const courseDetails = useCourseById({ id: courseId ?? "" });
// 	const chapterDetails = useCourseChaptersByCourseId({
// 		courseId: courseId ?? "",
// 	});
// 	const chapterPages = useChapterPages({ chapterId: chapterId ?? "" });
// 	const currentChapter = chapterDetails.data?.chapters.find(
// 		(chapter) => chapter.id === chapterId,
// 	);
// 	if (
// 		courseDetails.isLoading ||
// 		chapterDetails.isLoading ||
// 		chapterPages.isLoading
// 	) {
// 		return (
// 			<div className="min-h-screen bg-gray-900 text-white px-6 py-8">
// 				Loading chapter...
// 			</div>
// 		);
// 	}

// 	if (!courseDetails.data || !chapterDetails.data || !chapterPages.data) {
// 		return (
// 			<div className="min-h-screen bg-gray-900 text-white px-6 py-8">
// 				Chapter not found
// 			</div>
// 		);
// 	}
// 	if (
// 		!courseDetails.data ||
// 		!currentChapter ||
// 		!chapterPages.data ||
// 		!chapterDetails.data
// 	) {
// 		return (
// 			<div className="min-h-screen bg-gray-900 text-white px-6 py-8">
// 				Chapter not found
// 			</div>
// 		);
// 	}

// 	function handleBackClick() {
// 		router.navigate({ to: `/chapters/${courseId}` });
// 	}

// 	return (
// 		<div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white px-6 py-8 pb-24">
// 			<Button onClick={handleBackClick} className="mb-4">
// 				← Back to Chapters
// 			</Button>

// 			<div className="mb-4">
// 				<p className="text-sm text-gray-400">{courseDetails.data.title}</p>
// 				<h1 className="text-3xl font-bold mt-1">
// 					{
// 						chapterDetails.data.chapters.find(
// 							(chapter) => chapter.id === chapterId,
// 						)?.title
// 					}
// 				</h1>
// 			</div>

// 			{chapterDetails.data.chapters.find((chapter) => chapter.id === chapterId)
// 				?.description && (
// 				<p className="text-gray-300 mb-6">
// 					{
// 						chapterDetails.data.chapters.find(
// 							(chapter) => chapter.id === chapterId,
// 						)?.description
// 					}
// 				</p>
// 			)}

// 			<div className="bg-gray-800 rounded-lg p-6">
// 				{/* Add your chapter content here */}
// 				<div className="prose prose-invert max-w-none">
// 					{chapterPages.data.pages.map((page, index) => (
// 						<div key={page.id} className="mb-8">
// 							<h2 className="text-2xl font-semibold mb-4">{page.title}</h2>
// 							<div dangerouslySetInnerHTML={{ __html: page.content }} />
// 						</div>
// 					))}
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

import {
	useChapterGameAnswer,
	useChapterGameSession,
	useChapterPages,
	useCourseById,
	useCourseChaptersByCourseId,
} from "@pantha/react/hooks";
import type { ChapterPageFlat } from "@pantha/server";
import { useParams, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import Button from "../../shared/components/Button";

export default function ChapterDetails() {
	const { courseId, chapterId } = useParams({ strict: false });
	const router = useRouter();

	const courseDetails = useCourseById({ id: courseId ?? "" });
	const chapterDetails = useCourseChaptersByCourseId({
		courseId: courseId ?? "",
	});
	const chapterPages = useChapterPages({ chapterId: chapterId ?? "" });

	// Game session hooks
	const gameSession = useChapterGameSession({ chapterId: chapterId ?? "" });
	const submitAnswer = useChapterGameAnswer({ chapterId: chapterId ?? "" });

	const currentChapter = chapterDetails.data?.chapters.find(
		(chapter) => chapter.id === chapterId,
	);

	// Get current page index from game session
	const currentPageIndex = gameSession.data?.currentPage ?? 0;
	const isSessionActive = !gameSession.isError;

	if (
		courseDetails.isLoading ||
		chapterDetails.isLoading ||
		chapterPages.isLoading ||
		gameSession.isLoading
	) {
		return (
			<div className="min-h-screen bg-gray-900 text-white px-6 py-8">
				Loading chapter...
			</div>
		);
	}

	if (
		!courseDetails.data ||
		!chapterDetails.data ||
		!chapterPages.data ||
		!currentChapter
	) {
		return (
			<div className="min-h-screen bg-gray-900 text-white px-6 py-8">
				Chapter not found
			</div>
		);
	}

	function handleBackClick() {
		router.navigate({ to: `/chapters/${courseId}` });
	}

	// Handle answer submission
	async function handleAnswerSubmit(answer: string[]) {
		try {
			await submitAnswer.mutateAsync({ answer });
		} catch (error) {
			console.error("Error submitting answer:", error);
		}
	}

	// Get the current page to display
	const currentPage = chapterPages.data.pages[currentPageIndex];
	const totalPages = chapterPages.data.pages.length;
	const isLastPage = currentPageIndex >= totalPages - 1;

	function renderPageContent(
		page: { id: string; content: ChapterPageFlat },
		onAnswerSubmit: (answer: string[]) => Promise<void>,
	) {
		const { content } = page;

		switch (content.type) {
			case "teach_and_explain_content": {
				return (
					<TeachContentComponent
						content={content}
						imageUrl={content.imageUrl}
						onContinue={() => onAnswerSubmit(["continue"])}
					/>
				);
			}

			case "example_usages": {
				return (
					<ExampleUsagesComponent
						content={content}
						imageUrl={content.imageUrl}
						pageId={page.id}
						onContinue={() => onAnswerSubmit(["continue"])}
					/>
				);
			}

			case "quiz":
				return (
					<QuizComponent
						content={content}
						imageUrl={content.imageUrl}
						pageId={page.id}
						onAnswerSubmit={onAnswerSubmit}
					/>
				);

			case "true_false":
				return (
					<TrueFalseComponent
						content={content}
						imageUrl={content.imageUrl}
						onAnswerSubmit={onAnswerSubmit}
					/>
				);

			case "fill_in_the_blanks":
				return (
					<FillInTheBlanksComponent
						content={content}
						imageUrl={content.imageUrl}
						pageId={page.id}
						onAnswerSubmit={onAnswerSubmit}
					/>
				);

			case "matching":
				return (
					<MatchingComponent
						content={content}
						imageUrl={content.imageUrl}
						pageId={page.id}
						onAnswerSubmit={onAnswerSubmit}
					/>
				);

			default:
				return <div>Unsupported content type: {content.type}</div>;
		}
	}

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8 pb-24">
			<Button onClick={handleBackClick} className="mb-4">
				← Back to Chapters
			</Button>

			<div className="mb-4">
				<p className="text-sm text-gray-400">{courseDetails.data.title}</p>
				<h1 className="text-3xl font-bold mt-1">{currentChapter.title}</h1>
			</div>
			{currentChapter.description && (
				<p className="text-gray-300 mb-6">{currentChapter.description}</p>
			)}

			{/* Progress indicator */}
			{isSessionActive && (
				<div className="mb-6">
					<div className="flex justify-between text-sm text-gray-400 mb-2">
						<span>Progress</span>
						<span>
							{currentPageIndex + 1} / {totalPages}
						</span>
					</div>
					<div className="w-full bg-gray-700 rounded-full h-2">
						<div
							className="bg-blue-500 h-2 rounded-full transition-all duration-300"
							style={{
								width: `${((currentPageIndex + 1) / totalPages) * 100}%`,
							}}
						/>
					</div>
				</div>
			)}

			{/* Display current page or completion message */}
			<div className="space-y-6">
				{!currentPage || (isLastPage && currentPageIndex >= totalPages) ? (
					<div className="bg-linear-to-br from-gray-800 to-gray-700 rounded-lg p-8 text-center">
						<h2 className="text-4xl font-bold mb-2">🎉 Chapter Complete!</h2>
						<p className="text-gray-300 mb-8 text-lg">
							Congratulations! You've finished all pages in this chapter.
						</p>

						{/* Score Breakdown */}
						<div className="grid grid-cols-3 gap-4 mb-8">
							{/* Correct */}
							<div className="bg-green-900/30 border border-green-500 rounded-lg p-6">
								<p className="text-green-400 text-sm font-semibold mb-2">
									Correct
								</p>
								<p className="text-4xl font-bold text-green-400">
									{gameSession.data?.correctCount ?? 0}
								</p>
							</div>

							{/* Incorrect */}
							<div className="bg-red-900/30 border border-red-500 rounded-lg p-6">
								<p className="text-red-400 text-sm font-semibold mb-2">
									Incorrect
								</p>
								<p className="text-4xl font-bold text-red-400">
									{gameSession.data?.incorrectCount ?? 0}
								</p>
							</div>

							{/* Total */}
							<div className="bg-blue-900/30 border border-blue-500 rounded-lg p-6">
								<p className="text-blue-400 text-sm font-semibold mb-2">
									Total
								</p>
								<p className="text-4xl font-bold text-blue-400">
									{gameSession.data?.totalPages ?? totalPages}
								</p>
							</div>
						</div>

						{/* Progress Percentage */}
						{gameSession.data && (
							<div className="mb-8">
								<p className="text-gray-300 mb-3">Your Score</p>
								<div className="w-full bg-gray-700 rounded-full h-3 mb-3">
									<div
										className="bg-linear-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
										style={{
											width: `${((gameSession.data.correctCount ?? 0) / (gameSession.data.totalPages ?? 1)) * 100}%`,
										}}
									/>
								</div>
								<p className="text-2xl font-bold text-white">
									{Math.round(
										((gameSession.data.correctCount ?? 0) /
											(gameSession.data.totalPages ?? 1)) *
											100,
									)}
									%
								</p>
							</div>
						)}

						<Button onClick={handleBackClick} className="mt-6">
							← Back to Chapters
						</Button>
					</div>
				) : (
					<div className="bg-gray-800 rounded-lg p-6">
						{renderPageContent(
							currentPage as { id: string; content: ChapterPageFlat },
							handleAnswerSubmit,
						)}
					</div>
				)}
			</div>
		</div>
	);
}

// Component for teaching content (read-only, just click to continue)
function TeachContentComponent({
	content,
	imageUrl,
	onContinue,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
	onContinue: () => void;
}) {
	return (
		<div>
			<h3 className="text-xl font-semibold mb-3">{content.topic}</h3>
			{imageUrl && (
				<img
					src={imageUrl}
					alt={content.topic || "Content image"}
					className="mb-4 rounded"
				/>
			)}
			<div className="prose prose-invert max-w-none mb-6">
				{content.markdown && (
					<>
						{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content from AI is rendered as HTML */}
						<div dangerouslySetInnerHTML={{ __html: content.markdown }} />
					</>
				)}
			</div>
			<Button onClick={onContinue} className="w-full">
				Continue
			</Button>
		</div>
	);
}

// Component for example usages
function ExampleUsagesComponent({
	content,
	imageUrl,
	pageId,
	onContinue,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
	pageId: string;
	onContinue: () => void;
}) {
	return (
		<div>
			<h3 className="text-xl font-semibold mb-3">{content.topic}</h3>
			{imageUrl && (
				<img
					src={imageUrl}
					alt={content.topic || "Content image"}
					className="mb-4 rounded"
				/>
			)}
			<p className="mb-4">{content.text}</p>
			{content.examples && content.examples.length > 0 && (
				<div className="space-y-2 mb-6">
					<p className="font-semibold">Examples:</p>
					<ul className="list-disc pl-6">
						{content.examples.map((example: string) => (
							<li key={`${pageId}-${example}`}>{example}</li>
						))}
					</ul>
				</div>
			)}
			<Button onClick={onContinue} className="w-full">
				Continue
			</Button>
		</div>
	);
}

function QuizComponent({
	content,
	imageUrl,
	pageId,
	onAnswerSubmit,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
	pageId: string;
	onAnswerSubmit: (answer: string[]) => Promise<void>;
}) {
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (selectedOption === null) return;

		setIsSubmitting(true);
		setShowResult(true);

		try {
			// Submit answer as string array - this will update the session
			await onAnswerSubmit([selectedOption.toString()]);
			// Wait 2 seconds before allowing next page to load
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting quiz answer:", error);
			setShowResult(false);
			setIsSubmitting(false);
		}
	};

	const isCorrect = selectedOption === content.correctOptionIndex;

	return (
		<div>
			<h3 className="text-xl font-semibold mb-4">Quiz</h3>
			{imageUrl && <img src={imageUrl} alt="Quiz" className="mb-4 rounded" />}
			<p className="mb-4">{content.question}</p>
			<div className="space-y-2">
				{content.options?.map((option: string, idx: number) => (
					<button
						key={`${pageId}-${option}`}
						type="button"
						onClick={() => !showResult && setSelectedOption(idx)}
						className={`w-full text-left p-3 rounded border ${
							selectedOption === idx
								? "border-blue-500 bg-blue-900/30"
								: "border-gray-600"
						} ${showResult && idx === content.correctOptionIndex ? "bg-green-900/30 border-green-500" : ""} ${
							showResult &&
							selectedOption === idx &&
							idx !== content.correctOptionIndex
								? "bg-red-900/30 border-red-500"
								: ""
						}`}
						disabled={showResult}
					>
						{option}
					</button>
				))}
			</div>
			{!showResult && selectedOption !== null && (
				<Button
					onClick={handleSubmit}
					className="mt-4 w-full"
					disabled={isSubmitting}
				>
					{isSubmitting ? "Submitting..." : "Submit Answer"}
				</Button>
			)}
			{showResult && (
				<div className="mt-4">
					<p
						className={`mb-2 text-lg font-semibold ${isCorrect ? "text-green-400" : "text-red-400"}`}
					>
						{isCorrect ? "✓ Correct!" : "✗ Incorrect"}
					</p>
					{!isCorrect && (
						<p className="text-sm text-gray-400">
							The correct answer is highlighted in green above.
						</p>
					)}
					<p className="text-sm text-blue-400 mt-3">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

function TrueFalseComponent({
	content,
	imageUrl,
	onAnswerSubmit,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
	onAnswerSubmit: (answer: string[]) => Promise<void>;
}) {
	const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (selectedAnswer === null) return;

		setIsSubmitting(true);
		setShowResult(true);

		try {
			await onAnswerSubmit([selectedAnswer.toString()]);
			// Wait 2 seconds before allowing next page to load
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting true/false answer:", error);
			setIsSubmitting(false);
		}
	};

	const isCorrect = selectedAnswer === content.isTrue;

	return (
		<div>
			<h3 className="text-xl font-semibold mb-4">True or False</h3>
			{imageUrl && (
				<img src={imageUrl} alt="True/False" className="mb-4 rounded" />
			)}
			<p className="mb-4">{content.statement}</p>
			<div className="flex gap-4">
				<Button
					type="button"
					onClick={() => !showResult && setSelectedAnswer(true)}
					className={`flex-1 p-3 rounded border ${
						selectedAnswer === true
							? "border-blue-500 bg-blue-900/30"
							: "border-gray-600"
					} ${showResult && content.isTrue ? "bg-green-900/30 border-green-500" : ""}`}
					disabled={showResult}
				>
					True
				</Button>
				<Button
					type="button"
					onClick={() => !showResult && setSelectedAnswer(false)}
					className={`flex-1 p-3 rounded border ${
						selectedAnswer === false
							? "border-blue-500 bg-blue-900/30"
							: "border-gray-600"
					} ${showResult && !content.isTrue ? "bg-green-900/30 border-green-500" : ""}`}
					disabled={showResult}
				>
					False
				</Button>
			</div>
			{!showResult && selectedAnswer !== null && (
				<Button
					onClick={handleSubmit}
					className="mt-4 w-full"
					disabled={isSubmitting}
				>
					{isSubmitting ? "Submitting..." : "Submit Answer"}
				</Button>
			)}
			{showResult && (
				<p className={`mt-4 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
					{isCorrect ? "✓ Correct!" : "✗ Incorrect"}
				</p>
			)}
		</div>
	);
}

function FillInTheBlanksComponent({
	content,
	imageUrl,
	pageId,
	onAnswerSubmit,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
	pageId: string;
	onAnswerSubmit: (answer: string[]) => Promise<void>;
}) {
	const words = content.sentence?.split(" ") || [];
	const [userInputs, setUserInputs] = useState<string[]>(
		content.missingWordIndices?.map(() => "") || [],
	);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setShowResult(true);

		try {
			// Submit the user's answers for the blanks
			await onAnswerSubmit(userInputs);
			// Wait 2 seconds before allowing next page to load
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting fill in the blanks answer:", error);
			setShowResult(false);
			setIsSubmitting(false);
		}
	};

	// Check if all inputs are filled
	const allFilled = userInputs.every((input) => input.trim().length > 0);

	return (
		<div>
			<h3 className="text-xl font-semibold mb-4">Fill in the Blanks</h3>
			{imageUrl && (
				<img src={imageUrl} alt="Fill in the blanks" className="mb-4 rounded" />
			)}
			<div className="mb-4 text-lg">
				{words.map((word: string, idx: number) => {
					const blankIndex = content.missingWordIndices?.indexOf(idx) ?? -1;
					if (blankIndex !== -1) {
						const correctWord = words[idx];
						const userAnswer = userInputs[blankIndex];
						const isCorrect =
							showResult &&
							userAnswer.toLowerCase().trim() ===
								correctWord.toLowerCase().trim();
						const isIncorrect =
							showResult &&
							userAnswer.toLowerCase().trim() !==
								correctWord.toLowerCase().trim();

						return (
							<input
								key={`${pageId}-blank-${blankIndex}`}
								type="text"
								placeholder="..."
								value={userInputs[blankIndex]}
								onChange={(e) => {
									const newInputs = [...userInputs];
									newInputs[blankIndex] = e.target.value;
									setUserInputs(newInputs);
								}}
								className={`inline-block mx-1 px-3 py-2 border-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 text-center font-medium ${
									isCorrect
										? "bg-green-900/30 border-green-500"
										: isIncorrect
											? "bg-red-900/30 border-red-500"
											: "bg-gray-700 border-gray-500 text-white"
								}`}
								disabled={showResult}
							/>
						);
					}
					return (
						<span key={`${pageId}-word-${idx}-${word.substring(0, 10)}`}>
							{word}{" "}
						</span>
					);
				})}
			</div>
			{!showResult && (
				<Button
					onClick={handleSubmit}
					className="mt-4 w-full"
					disabled={!allFilled || isSubmitting}
				>
					{isSubmitting ? "Submitting..." : "Submit Answer"}
				</Button>
			)}
			{showResult && (
				<div className="mt-4">
					<p className="text-blue-400 mb-2">
						Answer submitted! The correct words are highlighted in green.
					</p>
					<p className="text-sm text-blue-400">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

// New Matching Component
function MatchingComponent({
	content,
	imageUrl,
	pageId,
	onAnswerSubmit,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
	pageId: string;
	onAnswerSubmit: (answer: string[]) => Promise<void>;
}) {
	const [matches, setMatches] = useState<Record<number, number>>({});
	const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const pairs = content.pairs || [];

	const handleLeftClick = (index: number) => {
		if (showResult) return;
		setSelectedLeft(index);
	};

	const handleRightClick = (index: number) => {
		if (showResult || selectedLeft === null) return;

		setMatches((prev) => ({
			...prev,
			[selectedLeft]: index,
		}));
		setSelectedLeft(null);
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		setShowResult(true);

		try {
			// Convert matches to array format expected by backend
			const answer = pairs.map(
				(_pair: { left: string; right: string }, idx: number) => {
					const rightIndex = matches[idx];
					return rightIndex !== undefined ? pairs[rightIndex]?.right : "";
				},
			);

			await onAnswerSubmit(answer);
			// Wait 2 seconds before allowing next page to load
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting matching answer:", error);
			setIsSubmitting(false);
		}
	};

	const allMatched = Object.keys(matches).length === pairs.length;

	return (
		<div>
			<h3 className="text-xl font-semibold mb-4">Match the Pairs</h3>
			{imageUrl && (
				<img src={imageUrl} alt="Matching" className="mb-4 rounded" />
			)}
			<p className="mb-4 text-gray-300">
				Click a term on the left, then click its match on the right.
			</p>

			<div className="grid grid-cols-2 gap-4 mb-6">
				{/* Left column */}
				<div className="space-y-2">
					{pairs.map((pair: { left: string; right: string }, idx: number) => (
						<button
							key={`${pageId}-left-${pair.left}`}
							type="button"
							onClick={() => handleLeftClick(idx)}
							className={`w-full text-left p-3 rounded border ${
								selectedLeft === idx
									? "border-blue-500 bg-blue-900/30"
									: "border-gray-600"
							} ${matches[idx] !== undefined ? "opacity-50" : ""}`}
							disabled={showResult || matches[idx] !== undefined}
						>
							{pair.left}
						</button>
					))}
				</div>

				{/* Right column */}
				<div className="space-y-2">
					{pairs.map((pair: { left: string; right: string }, idx: number) => {
						const isMatched = Object.values(matches).includes(idx);
						return (
							<button
								key={`${pageId}-right-${pair.right}`}
								type="button"
								onClick={() => handleRightClick(idx)}
								className={`w-full text-left p-3 rounded border ${
									isMatched ? "opacity-50 border-gray-600" : "border-gray-600"
								} ${selectedLeft !== null && !isMatched ? "hover:border-blue-400" : ""}`}
								disabled={showResult || isMatched}
							>
								{pair.right}
							</button>
						);
					})}
				</div>
			</div>

			{/* Show current matches */}
			{Object.keys(matches).length > 0 && !showResult && (
				<div className="mb-4 text-sm text-gray-400">
					<p>
						Matches: {Object.keys(matches).length} / {pairs.length}
					</p>
				</div>
			)}

			{!showResult && (
				<Button
					onClick={handleSubmit}
					className="mt-4 w-full"
					disabled={!allMatched || isSubmitting}
				>
					{isSubmitting ? "Submitting..." : "Submit Answer"}
				</Button>
			)}
			{showResult && (
				<div className="mt-4">
					<p className="text-blue-400 font-semibold">✓ Answer submitted!</p>
					<p className="text-sm text-blue-400 mt-2">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

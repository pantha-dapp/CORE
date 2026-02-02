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
	useChapterPages,
	useCourseById,
	useCourseChaptersByCourseId,
} from "@pantha/react/hooks";
import type { ChapterPageFlat } from "@pantha/server/lib/ai/tasks/generateChapterPage";
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

	const currentChapter = chapterDetails.data?.chapters.find(
		(chapter) => chapter.id === chapterId,
	);

	if (
		courseDetails.isLoading ||
		chapterDetails.isLoading ||
		chapterPages.isLoading
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

	function renderPageContent(page: { id: string; content: ChapterPageFlat }) {
		const { content } = page;

		switch (content.type) {
			case "teach_and_explain_content": {
				return (
					<div>
						<h3 className="text-xl font-semibold mb-3">{content.topic}</h3>
						{content.imageUrl && (
							<img
								src={content.imageUrl}
								alt={content.topic || "Content image"}
								className="mb-4 rounded"
							/>
						)}
						<div className="prose prose-invert max-w-none">
							{content.markdown && (
								<>
									{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content from AI is rendered as HTML */}
									<div dangerouslySetInnerHTML={{ __html: content.markdown }} />
								</>
							)}
						</div>
					</div>
				);
			}

			case "example_usages": {
				return (
					<div>
						<h3 className="text-xl font-semibold mb-3">{content.topic}</h3>
						{content.imageUrl && (
							<img
								src={content.imageUrl}
								alt={content.topic || "Content image"}
								className="mb-4 rounded"
							/>
						)}
						<p className="mb-4">{content.text}</p>
						{content.examples && content.examples.length > 0 && (
							<div className="space-y-2">
								<p className="font-semibold">Examples:</p>
								<ul className="list-disc pl-6">
									{content.examples.map((example: string, idx: number) => (
										<li
											key={`${page.id}-example-${idx}-${example.substring(0, 20)}`}
										>
											{example}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				);
			}

			case "quiz":
				return (
					<QuizComponent
						content={content}
						imageUrl={content.imageUrl}
						pageId={page.id}
					/>
				);

			case "true_false":
				return (
					<TrueFalseComponent content={content} imageUrl={content.imageUrl} />
				);

			case "fill_in_the_blanks":
				return (
					<FillInTheBlanksComponent
						content={content}
						imageUrl={content.imageUrl}
						pageId={page.id}
					/>
				);

			default:
				return <div>Unsupported content type</div>;
		}
	}

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8 pb-24">
			<Button onClick={handleBackClick} className="mb-4">
				← Back to Chapters
			</Button>
			more
			<div className="mb-4">
				<p className="text-sm text-gray-400">{courseDetails.data.title}</p>
				<h1 className="text-3xl font-bold mt-1">{currentChapter.title}</h1>
			</div>
			{currentChapter.description && (
				<p className="text-gray-300 mb-6">{currentChapter.description}</p>
			)}
			<div className="space-y-6">
				{chapterPages.data.pages.length === 0 ? (
					<p className="text-gray-400">
						No content available for this chapter.
					</p>
				) : (
					chapterPages.data.pages.map((page) => (
						<div key={page.id} className="bg-gray-800 rounded-lg p-6">
							{renderPageContent(
								page as { id: string; content: ChapterPageFlat },
							)}
						</div>
					))
				)}
			</div>
		</div>
	);
}

function QuizComponent({
	content,
	imageUrl,
	pageId,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
	pageId: string;
}) {
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [showResult, setShowResult] = useState(false);

	const handleSubmit = () => {
		setShowResult(true);
	};

	return (
		<div>
			<h3 className="text-xl font-semibold mb-4">Quiz</h3>
			{imageUrl && <img src={imageUrl} alt="Quiz" className="mb-4 rounded" />}
			<p className="mb-4">{content.question}</p>
			<div className="space-y-2">
				{content.options?.map((option: string, idx: number) => (
					<button
						key={`${pageId}-option-${idx}-${option.substring(0, 15)}`}
						type="button"
						onClick={() => setSelectedOption(idx)}
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
				<Button onClick={handleSubmit} className="mt-4">
					Submit Answer
				</Button>
			)}
			{showResult && (
				<p
					className={`mt-4 ${selectedOption === content.correctOptionIndex ? "text-green-400" : "text-red-400"}`}
				>
					{selectedOption === content.correctOptionIndex
						? "Correct!"
						: "Incorrect. Try again!"}
				</p>
			)}
		</div>
	);
}

function TrueFalseComponent({
	content,
	imageUrl,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
}) {
	const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
	const [showResult, setShowResult] = useState(false);

	const handleSubmit = () => {
		setShowResult(true);
	};

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
					onClick={() => setSelectedAnswer(true)}
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
					onClick={() => setSelectedAnswer(false)}
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
				<Button onClick={handleSubmit} className="mt-4">
					Submit Answer
				</Button>
			)}
			{showResult && (
				<p
					className={`mt-4 ${selectedAnswer === content.isTrue ? "text-green-400" : "text-red-400"}`}
				>
					{selectedAnswer === content.isTrue ? "Correct!" : "Incorrect!"}
				</p>
			)}
		</div>
	);
}

function FillInTheBlanksComponent({
	content,
	imageUrl,
	pageId,
}: {
	content: ChapterPageFlat;
	imageUrl?: string;
	pageId: string;
}) {
	const words = content.sentence?.split(" ") || [];
	const [userInputs, setUserInputs] = useState<string[]>(
		content.missingWordIndices?.map(() => "") || [],
	);
	const [showResult, setShowResult] = useState(false);

	const handleSubmit = () => {
		setShowResult(true);
	};

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
						return (
							<input
								key={`${pageId}-blank-${blankIndex}`}
								type="text"
								value={userInputs[blankIndex]}
								onChange={(e) => {
									const newInputs = [...userInputs];
									newInputs[blankIndex] = e.target.value;
									setUserInputs(newInputs);
								}}
								className="inline-block mx-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded w-32"
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
				<Button onClick={handleSubmit} className="mt-4">
					Submit Answer
				</Button>
			)}
			{showResult && (
				<p className="mt-4 text-yellow-400">
					Answer submitted! (Add validation logic to check correctness)
				</p>
			)}
		</div>
	);
}

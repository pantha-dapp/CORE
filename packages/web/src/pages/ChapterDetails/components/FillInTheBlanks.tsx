import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	wrongOptions?: string[];
	words: string[];
	answers: string[];
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
}

export function FillInTheBlanks({
	imageUrl,
	onSubmit,
	words,
	wrongOptions = [],
}: Props) {
	// Count how many $1, $2, ... placeholders are in the words array
	// The server intentionally clears `answers` before sending to client (security),
	// so we determine blank count from placeholders in words
	const blankCount = useMemo(
		() => words.filter((w) => /^\$\d+$/.test(w)).length,
		[words],
	);

	const [userInputs, setUserInputs] = useState<string[]>(
		Array(blankCount).fill(""),
	);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// wrongOptions already contains the correct answers mixed in (server puts them there)
	// Show them shuffled as hints
	const availableOptions = useMemo(() => {
		const unique = Array.from(new Set(wrongOptions));
		return unique.sort(() => Math.random() - 0.5);
	}, [wrongOptions]);

	const allFilled =
		blankCount > 0 && userInputs.every((input) => input.trim().length > 0);

	async function handleSubmit() {
		if (!allFilled) return;

		setIsSubmitting(true);
		setShowResult(true);

		try {
			await onSubmit(userInputs);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting fill in the blanks:", error);
			setShowResult(false);
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			<h3 className="text-2xl font-bold">Fill in the Blanks</h3>

			{imageUrl && (
				<img src={imageUrl} alt="Question" className="rounded-lg w-full" />
			)}

			{/* Sentence with blanks */}
			<div className="bg-gray-900/50 p-6 rounded-lg text-lg leading-loose">
				{words.map((word, idx) => {
					const placeholderMatch = word.match(/^\$(\d+)$/);

					if (placeholderMatch) {
						// 0-indexed blank slot
						const blankIndex = parseInt(placeholderMatch[1], 10) - 1;
						const userAnswer = userInputs[blankIndex] ?? "";
						const isCorrect = showResult && userAnswer.trim().length > 0;

						return (
							<input
								// use blankIndex and the placeholder word for a stable, meaningful key
								key={`blank-${blankIndex}-${word}`}
								type="text"
								placeholder="___"
								value={userAnswer}
								onChange={(e) => {
									const newInputs = [...userInputs];
									newInputs[blankIndex] = e.target.value;
									setUserInputs(newInputs);
								}}
								disabled={showResult || isSubmitting}
								autoComplete="off"
								className={`inline-block mx-1 px-3 py-1 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus:outline-none focus:border-blue-400 w-28 text-center font-semibold transition-colors ${
									isCorrect
										? "border-green-500 text-green-300"
										: "border-gray-400 text-white"
								}`}
							/>
						);
					}

					// include the word text and its occurrence index to make the key stable
					// (avoid using `idx` directly to prevent unstable keys on reordering)
					return (
						<span
							key={`word-${word}-${words.slice(0, idx).filter((w) => w === word).length}`}
							className="text-gray-200"
						>
							{word}{" "}
						</span>
					);
				})}
			</div>

			{/* Available words as hints */}
			{availableOptions.length > 0 && (
				<div className="bg-gray-800/50 p-5 rounded-lg">
					<h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
						💡 Word Bank (Hints)
					</h4>
					<div className="flex flex-wrap gap-2">
						{availableOptions.map((option) => (
							<span
								// options are deduplicated; use the option text as a stable key
								key={`hint-${option}`}
								className="px-3 py-1 rounded-full text-sm bg-gray-700 border border-gray-500 text-gray-300"
							>
								{option}
							</span>
						))}
					</div>
				</div>
			)}

			{!showResult && (
				<Button
					onClick={handleSubmit}
					className="w-full"
					disabled={!allFilled || isSubmitting}
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</Button>
			)}

			{showResult && (
				<div className="bg-blue-500/10 p-4 rounded-lg">
					<p className="text-blue-400 font-semibold mb-1">Answer submitted!</p>
					<p className="text-sm text-blue-400 mt-1">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

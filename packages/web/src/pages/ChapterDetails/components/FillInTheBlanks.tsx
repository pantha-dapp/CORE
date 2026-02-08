import { useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	sentance: string;
	missingWordIndices: number[];
	wrongOptions?: string[];
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
}

export function FillInTheBlanks({
	sentance,
	missingWordIndices,
	imageUrl,
	onSubmit,
}: Props) {
	const words = sentance.split(" ");
	const [userInputs, setUserInputs] = useState<string[]>(
		missingWordIndices.map(() => ""),
	);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const allFilled = userInputs.every((input) => input.trim().length > 0);

	async function handleSubmit() {
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
		<div className="space-y-4">
			<h3 className="text-2xl font-bold">Fill in the Blanks</h3>
			{imageUrl && (
				<img
					src={imageUrl}
					alt="Fill in the blanks"
					className="rounded-lg w-full"
				/>
			)}
			<div className="bg-gray-900/50 p-6 rounded-lg text-lg leading-relaxed">
				{words.map((word, idx) => {
					const blankIndex = missingWordIndices.indexOf(idx);

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
								key={`blank-${idx}-${word}`}
								type="text"
								placeholder="..."
								value={userInputs[blankIndex]}
								onChange={(e) => {
									const newInputs = [...userInputs];
									newInputs[blankIndex] = e.target.value;
									setUserInputs(newInputs);
								}}
								disabled={showResult}
								className={`inline-block mx-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 text-center font-medium ${
									isCorrect
										? "bg-green-500/10 border-green-500 text-green-400"
										: isIncorrect
											? "bg-red-500/10 border-red-500 text-red-400"
											: "bg-gray-700 border-gray-500 text-white"
								}`}
							/>
						);
					}

					return (
						<span key={`word-${idx}-${word}`} className="text-gray-200">
							{word}{" "}
						</span>
					);
				})}
			</div>

			{!showResult && (
				<Button
					onClick={handleSubmit}
					className="w-full mt-6"
					disabled={!allFilled || isSubmitting}
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</Button>
			)}

			{showResult && (
				<div className="bg-blue-500/10 p-4 rounded-lg">
					<p className="text-blue-400 font-semibold mb-1">Answer submitted!</p>
					<p className="text-sm text-gray-300">
						Correct words are shown in green above.
					</p>
					<p className="text-sm text-blue-400 mt-2">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

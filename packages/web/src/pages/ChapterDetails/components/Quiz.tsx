import { useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	question: string;
	options: string[];
	correctOptionIndex: number;
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
}

export function Quiz({
	question,
	options,
	correctOptionIndex,
	imageUrl,
	onSubmit,
}: Props) {
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isCorrect = selectedOption === correctOptionIndex;

	async function handleSubmit() {
		if (selectedOption === null) return;

		setIsSubmitting(true);
		setShowResult(true);

		try {
			await onSubmit([selectedOption.toString()]);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting quiz:", error);
			setShowResult(false);
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-4">
			<h3 className="text-2xl font-bold">Quiz</h3>
			{imageUrl && (
				<img src={imageUrl} alt="Quiz" className="rounded-lg w-full" />
			)}
			<p className="text-lg text-gray-200">{question}</p>

			<div className="space-y-3">
				{options.map((option, idx) => {
					const isSelected = selectedOption === idx;
					const isCorrectAnswer = idx === correctOptionIndex;
					const showCorrect = showResult && isCorrectAnswer;
					const showIncorrect = showResult && isSelected && !isCorrectAnswer;

					return (
						<button
							key={option}
							type="button"
							onClick={() => !showResult && setSelectedOption(idx)}
							disabled={showResult}
							className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
								isSelected && !showResult
									? "border-blue-500 bg-blue-500/10"
									: "border-gray-600 hover:border-gray-500"
							} ${showCorrect ? "border-green-500 bg-green-500/10" : ""} ${
								showIncorrect ? "border-red-500 bg-red-500/10" : ""
							}`}
						>
							<div className="flex items-center gap-3">
								<span className="text-sm font-semibold text-gray-400">
									{String.fromCharCode(65 + idx)}
								</span>
								<span className="flex-1">{option}</span>
								{showCorrect && <span className="text-green-400">✓</span>}
								{showIncorrect && <span className="text-red-400">✗</span>}
							</div>
						</button>
					);
				})}
			</div>

			{!showResult && selectedOption !== null && (
				<Button
					onClick={handleSubmit}
					className="w-full mt-6"
					disabled={isSubmitting}
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</Button>
			)}

			{showResult && (
				<div
					className={`p-4 rounded-lg ${isCorrect ? "bg-green-500/10" : "bg-red-500/10"}`}
				>
					<p
						className={`font-bold text-lg mb-1 ${isCorrect ? "text-green-400" : "text-red-400"}`}
					>
						{isCorrect ? "✓ Correct!" : "✗ Incorrect"}
					</p>
					{!isCorrect && (
						<p className="text-sm text-gray-300">
							The correct answer was option{" "}
							{String.fromCharCode(65 + correctOptionIndex)}
						</p>
					)}
					<p className="text-sm text-blue-400 mt-2">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

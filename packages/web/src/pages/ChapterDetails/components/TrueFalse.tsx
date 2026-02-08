import { useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	statement: string;
	isTrue: boolean;
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
}

export function TrueFalse({ statement, isTrue, imageUrl, onSubmit }: Props) {
	const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isCorrect = selectedAnswer === isTrue;

	async function handleSubmit() {
		if (selectedAnswer === null) return;

		setIsSubmitting(true);
		setShowResult(true);

		try {
			await onSubmit([selectedAnswer.toString()]);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting true/false:", error);
			setShowResult(false);
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-4">
			<h3 className="text-2xl font-bold">True or False</h3>
			{imageUrl && (
				<img src={imageUrl} alt="True/False" className="rounded-lg w-full" />
			)}
			<p className="text-lg text-gray-200 bg-gray-900/50 p-4 rounded-lg">
				{statement}
			</p>

			<div className="grid grid-cols-2 gap-4">
				<button
					type="button"
					onClick={() => !showResult && setSelectedAnswer(true)}
					disabled={showResult}
					className={`p-6 rounded-lg border-2 font-bold text-lg transition-all ${
						selectedAnswer === true && !showResult
							? "border-blue-500 bg-blue-500/10"
							: "border-gray-600 hover:border-gray-500"
					} ${showResult && isTrue ? "border-green-500 bg-green-500/10" : ""} ${
						showResult && selectedAnswer === true && !isTrue
							? "border-red-500 bg-red-500/10"
							: ""
					}`}
				>
					True
					{showResult && isTrue && (
						<span className="ml-2 text-green-400">✓</span>
					)}
				</button>

				<button
					type="button"
					onClick={() => !showResult && setSelectedAnswer(false)}
					disabled={showResult}
					className={`p-6 rounded-lg border-2 font-bold text-lg transition-all ${
						selectedAnswer === false && !showResult
							? "border-blue-500 bg-blue-500/10"
							: "border-gray-600 hover:border-gray-500"
					} ${showResult && !isTrue ? "border-green-500 bg-green-500/10" : ""} ${
						showResult && selectedAnswer === false && isTrue
							? "border-red-500 bg-red-500/10"
							: ""
					}`}
				>
					False
					{showResult && !isTrue && (
						<span className="ml-2 text-green-400">✓</span>
					)}
				</button>
			</div>

			{!showResult && selectedAnswer !== null && (
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
						className={`font-bold text-lg ${isCorrect ? "text-green-400" : "text-red-400"}`}
					>
						{isCorrect ? "✓ Correct!" : "✗ Incorrect"}
					</p>
					<p className="text-sm text-blue-400 mt-2">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

import { useEffect, useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	question: string;
	options: string[];
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
}

export function Quiz({
	question,
	options,
	imageUrl,
	onSubmit,
	answerResult,
	onContinue,
}: Props) {
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Reset local state when a new question is provided by the parent/back-end.
	useEffect(() => {
		setSelectedOption(null);
		setIsSubmitting(false);
	}, [question]);

	const showResult = answerResult !== null;
	const isCorrect = answerResult?.correct ?? false;

	async function handleSubmit() {
		if (selectedOption === null) return;

		setIsSubmitting(true);

		try {
			await onSubmit([selectedOption.toString()]);
		} catch (error) {
			console.error("Error submitting quiz:", error);
		} finally {
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
					const showCorrect = showResult && isSelected && isCorrect;
					const showIncorrect = showResult && isSelected && !isCorrect;

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
					className={`p-4 rounded-2xl border ${
						isCorrect
							? "border-green-500/40 bg-green-500/10"
							: "border-red-500/40 bg-red-500/10"
					}`}
				>
					<p
						className={`font-bold text-lg mb-1 ${isCorrect ? "text-green-400" : "text-red-400"}`}
					>
						{isCorrect ? "✓ Correct!" : "✗ Incorrect"}
					</p>
					<p className="text-sm text-gray-300">
						Your answer has been checked by the server.
					</p>
					<Button onClick={onContinue} className="w-full mt-4">
						Continue
					</Button>
				</div>
			)}
		</div>
	);
}

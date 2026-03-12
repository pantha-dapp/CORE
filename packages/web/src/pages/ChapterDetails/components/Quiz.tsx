import { useEffect, useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	question: string;
	options: string[];
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
	onViewExplanation?: () => void;
	isExplanationLoading?: boolean;
}

export function Quiz({
	question,
	options,
	imageUrl,
	onSubmit,
	answerResult,
	onContinue,
	onViewExplanation,
	isExplanationLoading,
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
					className={`overflow-hidden rounded-[1.75rem] border-2 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] ${
						isCorrect
							? "border-emerald-400/35 bg-linear-to-br from-emerald-500/18 to-emerald-400/8"
							: "border-rose-400/35 bg-linear-to-br from-rose-500/18 to-rose-400/8"
					}`}
				>
					<div className="mb-4 flex items-start gap-3">
						<div
							className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl ${isCorrect ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100" : "border-rose-300/30 bg-rose-300/15 text-rose-100"}`}
						>
							{isCorrect ? "⭐" : "💪"}
						</div>
						<div>
							<p
								className={`text-lg font-black ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}
							>
								{isCorrect ? "Nice work!" : "Not quite"}
							</p>
							<p className="mt-1 text-sm leading-6 text-slate-200">
								Check the explanation before moving to the next question.
							</p>
						</div>
					</div>
					{onViewExplanation && (
						<button
							type="button"
							onClick={onViewExplanation}
							className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3.5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/16"
						>
							<span>💡</span>
							<span>
								{isExplanationLoading
									? "Loading explanation…"
									: "View Explanation"}
							</span>
						</button>
					)}
					<Button
						onClick={onContinue}
						className="mt-3 w-full"
						icon="arrow-right"
						iconPosition="right"
					>
						Next Question
					</Button>
				</div>
			)}
		</div>
	);
}

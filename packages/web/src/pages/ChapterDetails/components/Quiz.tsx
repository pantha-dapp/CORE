import { useEffect, useState } from "react";

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
			<h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker">Quiz</h3>
			{imageUrl && (
				<img src={imageUrl} alt="Quiz" className="rounded-lg w-full" />
			)}
			<p className="text-lg text-gray-800 dark:text-dark-text font-montserrat">{question}</p>

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
							className={`w-full text-left p-4 rounded-xl transition-all font-montserrat ${
								isSelected && !showResult
									? "border-2 border-gray-800 dark:border-dark-accent bg-gray-100 dark:bg-dark-surface"
									: "border-2 border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border bg-white dark:bg-dark-surface"
							} ${showCorrect ? "border-2 border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20" : ""} ${
								showIncorrect ? "border-2 border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20" : ""
							}`}
						>
							<div className="flex items-center gap-3">
								<span className="text-sm font-semibold text-gray-500 dark:text-dark-muted">
									{String.fromCharCode(65 + idx)}
								</span>
								<span className="flex-1 text-gray-800 dark:text-dark-text">{option}</span>
								{showCorrect && <span className="text-green-600 dark:text-green-400">✓</span>}
								{showIncorrect && <span className="text-red-600 dark:text-red-400">✗</span>}
							</div>
						</button>
					);
				})}
			</div>

			{!showResult && selectedOption !== null && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="w-full mt-6 rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 disabled:opacity-50 font-montserrat"
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</button>
			)}

			{showResult && (
				<div
					className={`overflow-hidden rounded-xl p-5 ${
						isCorrect
							? "bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30"
							: "bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30"
					}`}
				>
					<div className="mb-4 flex items-start gap-3">
						<div
							className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${isCorrect ? "bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-400"}`}
						>
							{isCorrect ? "⭐" : "💪"}
						</div>
						<div>
							<p
								className={`text-lg font-bold font-tusker ${isCorrect ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}
							>
								{isCorrect ? "Nice work!" : "Not quite"}
							</p>
							<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
								Check the explanation before moving to the next question.
							</p>
						</div>
					</div>
					{onViewExplanation && (
						<button
							type="button"
							onClick={onViewExplanation}
							className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-dark-surface px-4 py-3.5 text-sm font-semibold text-gray-800 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border font-montserrat"
						>
							<span>💡</span>
							<span>
								{isExplanationLoading
									? "Loading explanation…"
									: "View Explanation"}
							</span>
						</button>
					)}
					<button
						type="button"
						onClick={onContinue}
						className="mt-3 w-full rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat"
					>
						Next Question →
					</button>
				</div>
			)}
		</div>
	);
}

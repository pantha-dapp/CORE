import { useEffect, useState } from "react";
import { MathText } from "../../../shared/components/MathText";
import { useHapticFeedback } from "../../../shared/utils/haptics";

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
	const hapticFeedback = useHapticFeedback();
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
		<>
			<div className="space-y-4">
				<h3 className="text-xl font-bold text-dark-text font-titillium">
					Quiz
				</h3>
				{imageUrl && (
					<img
						src={imageUrl}
						alt="Quiz"
						className="rounded-xl w-full border border-dark-border/50"
					/>
				)}
				<MathText block className="text-base text-dark-text font-titillium">
					{question}
				</MathText>

				<div className="space-y-2">
					{options.map((option, idx) => {
						const isSelected = selectedOption === idx;
						const showCorrect = showResult && isSelected && isCorrect;
						const showIncorrect = showResult && isSelected && !isCorrect;

						return (
							<button
								key={option}
								type="button"
								onClick={() => {
									if (!showResult) {
										hapticFeedback.tap();
										setSelectedOption(idx);
									}
								}}
								disabled={showResult}
								className={`w-full text-left p-3 rounded-lg transition-all font-titillium text-sm btn-press-zoom ${
									isSelected && !showResult
										? "border-2 border-dark-accent bg-dark-surface"
										: "border border-dark-border hover:border-dark-muted bg-dark-card"
								} ${showCorrect ? "border-2 border-dark-success/60 bg-dark-success/10" : ""} ${
									showIncorrect
										? "border-2 border-red-500/60 bg-red-900/20"
										: ""
								}`}
							>
								<div className="flex items-center gap-3">
									<span className="text-xs font-semibold text-dark-muted">
										{String.fromCharCode(65 + idx)}
									</span>
									<MathText className="flex-1 text-dark-text text-sm">
										{option}
									</MathText>
									{showCorrect && <span className="text-dark-success">✓</span>}
									{showIncorrect && <span className="text-red-400">✗</span>}
								</div>
							</button>
						);
					})}
				</div>

				{/* Result message */}
				{showResult && (
					<div
						className={`overflow-hidden rounded-xl p-4 mt-6 animate-chapter-result-in ${
							isCorrect
								? "bg-dark-success/10 border border-dark-success/30"
								: "bg-red-900/20 border border-red-500/30"
						}`}
					>
						<div className="flex items-start gap-3">
							<div
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${isCorrect ? "bg-dark-success/20 text-dark-success" : "bg-red-800/40 text-red-400"}`}
							>
								{isCorrect ? "⭐" : "💪"}
							</div>
							<div>
								<p
									className={`font-bold font-titillium text-base ${isCorrect ? "text-dark-success" : "text-red-400"}`}
								>
									{isCorrect ? "Nice work!" : "Not quite"}
								</p>
								<p className="mt-0.5 text-sm text-dark-muted font-titillium">
									Check the explanation before moving to the next question.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Fixed bottom buttons - outside animated wrapper so fixed works vs viewport */}
			{!showResult && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={selectedOption === null || isSubmitting}
					className={`fixed bottom-24 left-4 right-4 z-40 rounded-lg px-4 py-2.5 text-sm font-semibold font-titillium transition-all btn-press-zoom ${
						selectedOption === null
							? "bg-dark-surface text-dark-muted cursor-not-allowed"
							: "bg-dark-accent text-dark-bg hover:opacity-90"
					} ${isSubmitting ? "opacity-50" : ""}`}
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</button>
			)}

			{showResult && (
				<div className="fixed bottom-24 left-4 right-4 z-40 space-y-2 animate-chapter-result-in">
					{onViewExplanation && (
						<button
							type="button"
							onClick={onViewExplanation}
							className="w-full flex items-center justify-center gap-2 rounded-lg bg-dark-surface px-3 py-2 text-sm font-semibold text-dark-text hover:bg-dark-border font-titillium transition-colors btn-press-zoom"
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
						className="w-full rounded-lg bg-dark-accent px-4 py-2.5 text-sm font-semibold text-dark-bg hover:opacity-90 font-titillium transition-opacity btn-press-zoom"
					>
						Next Question →
					</button>
				</div>
			)}
		</>
	);
}

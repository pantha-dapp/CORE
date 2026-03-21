import { useState } from "react";
import { MathText } from "../../../shared/components/MathText";
import { useHapticFeedback } from "../../../shared/utils/haptics";

interface Props {
	statement: string;
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
	onViewExplanation?: () => void;
	isExplanationLoading?: boolean;
}

export function TrueFalse({
	statement,
	imageUrl,
	onSubmit,
	answerResult,
	onContinue,
	onViewExplanation,
	isExplanationLoading,
}: Props) {
	const hapticFeedback = useHapticFeedback();
	const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const showResult = answerResult !== null;
	const isCorrect = answerResult?.correct ?? false;

	async function handleSubmit() {
		if (selectedAnswer === null) return;

		setIsSubmitting(true);

		try {
			await onSubmit([selectedAnswer.toString()]);
		} catch (error) {
			console.error("Error submitting true/false:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<div className="space-y-4">
				<h3 className="text-xl font-bold text-dark-text font-titillium">
					True or False
				</h3>
				{imageUrl && (
					<img
						src={imageUrl}
						alt="True/False"
						className="rounded-xl w-full border border-dark-border/50"
					/>
				)}
				<MathText
					block
					className="text-base text-dark-text bg-dark-surface p-4 rounded-xl font-titillium border border-dark-border/50 min-h-16"
				>
					{statement}
				</MathText>

				<div className="grid grid-cols-2 gap-3">
					<button
						type="button"
						onClick={() => {
							if (!showResult) {
								hapticFeedback.tap();
								setSelectedAnswer(true);
							}
						}}
						disabled={showResult}
						className={`p-4 rounded-lg border-2 font-bold text-base transition-all font-titillium btn-press-zoom ${
							selectedAnswer === true && !showResult
								? "border-dark-accent bg-dark-surface"
								: "border-dark-border hover:border-dark-muted bg-dark-card"
						} ${showResult && selectedAnswer === true && isCorrect ? "border-dark-success/60 bg-dark-success/10" : ""} ${
							showResult && selectedAnswer === true && !isCorrect
								? "border-red-500/60 bg-red-900/20"
								: ""
						}`}
					>
						<span className="text-dark-text">True</span>
						{showResult && selectedAnswer === true && isCorrect && (
							<span className="ml-2 text-dark-success">✓</span>
						)}
					</button>

					<button
						type="button"
						onClick={() => {
							if (!showResult) {
								hapticFeedback.tap();
								setSelectedAnswer(false);
							}
						}}
						disabled={showResult}
						className={`p-4 rounded-lg border-2 font-bold text-base transition-all font-titillium btn-press-zoom ${
							selectedAnswer === false && !showResult
								? "border-dark-accent bg-dark-surface"
								: "border-dark-border hover:border-dark-muted bg-dark-card"
						} ${showResult && selectedAnswer === false && isCorrect ? "border-dark-success/60 bg-dark-success/10" : ""} ${
							showResult && selectedAnswer === false && !isCorrect
								? "border-red-500/60 bg-red-900/20"
								: ""
						}`}
					>
						<span className="text-dark-text">False</span>
						{showResult && selectedAnswer === false && isCorrect && (
							<span className="ml-2 text-dark-success">✓</span>
						)}
					</button>
				</div>

				{/* Result message */}
				{showResult && (
					<div
						className={`overflow-hidden rounded-xl p-4 mt-6 animate-chapter-result-in ${isCorrect ? "bg-dark-success/10 border border-dark-success/30" : "bg-red-900/20 border border-red-500/30"}`}
					>
						<div className="flex items-start gap-3">
							<div
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${isCorrect ? "bg-dark-success/20 text-dark-success" : "bg-red-800/40 text-red-400"}`}
							>
								{isCorrect ? "⭐" : "🧩"}
							</div>
							<div>
								<p
									className={`font-bold font-titillium text-base ${isCorrect ? "text-dark-success" : "text-red-400"}`}
								>
									{isCorrect ? "Correct!" : "Give it one quick review"}
								</p>
								<p className="mt-0.5 text-sm text-dark-muted font-titillium">
									Open the explanation, then move to the next one.
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
					disabled={selectedAnswer === null || isSubmitting}
					className={`fixed bottom-24 left-4 right-4 z-40 rounded-lg px-4 py-2.5 text-sm font-semibold font-titillium transition-all btn-press-zoom ${
						selectedAnswer === null
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

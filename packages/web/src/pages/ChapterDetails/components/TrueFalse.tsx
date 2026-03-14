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
		<div className="space-y-4">
			<h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker">
				True or False
			</h3>
			{imageUrl && (
				<img src={imageUrl} alt="True/False" className="rounded-lg w-full" />
			)}
			<MathText
				block
				className="text-lg text-gray-800 dark:text-dark-text bg-gray-100 dark:bg-dark-surface p-4 rounded-xl font-montserrat"
			>
				{statement}
			</MathText>

			<div className="grid grid-cols-2 gap-4">
				<button
					type="button"
					onClick={() => {
						if (!showResult) {
							hapticFeedback.tap();
							setSelectedAnswer(true);
						}
					}}
					disabled={showResult}
					className={`p-6 rounded-xl border-2 font-bold text-lg transition-all font-montserrat ${
						selectedAnswer === true && !showResult
							? "border-gray-800 dark:border-dark-accent bg-gray-100 dark:bg-dark-surface"
							: "border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border bg-white dark:bg-dark-surface"
					} ${showResult && selectedAnswer === true && isCorrect ? "border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20" : ""} ${
						showResult && selectedAnswer === true && !isCorrect
							? "border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20"
							: ""
					}`}
				>
					<span className="text-gray-800 dark:text-dark-text">True</span>
					{showResult && selectedAnswer === true && isCorrect && (
						<span className="ml-2 text-green-600 dark:text-green-400">✓</span>
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
					className={`p-6 rounded-xl border-2 font-bold text-lg transition-all font-montserrat ${
						selectedAnswer === false && !showResult
							? "border-gray-800 dark:border-dark-accent bg-gray-100 dark:bg-dark-surface"
							: "border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border bg-white dark:bg-dark-surface"
					} ${showResult && selectedAnswer === false && isCorrect ? "border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20" : ""} ${
						showResult && selectedAnswer === false && !isCorrect
							? "border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20"
							: ""
					}`}
				>
					<span className="text-gray-800 dark:text-dark-text">False</span>
					{showResult && selectedAnswer === false && isCorrect && (
						<span className="ml-2 text-green-600 dark:text-green-400">✓</span>
					)}
				</button>
			</div>

			{!showResult && selectedAnswer !== null && (
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
					className={`overflow-hidden rounded-xl p-5 ${isCorrect ? "bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30" : "bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30"}`}
				>
					<div className="mb-4 flex items-start gap-3">
						<div
							className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${isCorrect ? "bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-400"}`}
						>
							{isCorrect ? "⭐" : "🧩"}
						</div>
						<div>
							<p
								className={`text-lg font-bold font-tusker ${isCorrect ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}
							>
								{isCorrect ? "Correct!" : "Give it one quick review"}
							</p>
							<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
								Open the explanation, then move to the next one.
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

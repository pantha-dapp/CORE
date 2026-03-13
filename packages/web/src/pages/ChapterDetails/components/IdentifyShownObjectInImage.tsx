import { useState } from "react";

interface IdentifyShownObjectInImageProps {
	options: string[];
	image: {
		prompt: string;
	};
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
	onViewExplanation?: () => void;
	isExplanationLoading?: boolean;
}

export function IdentifyShownObjectInImage({
	options,
	image: { prompt },
	onSubmit,
	answerResult,
	onContinue,
	onViewExplanation,
	isExplanationLoading,
}: IdentifyShownObjectInImageProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const showResult = answerResult !== null;
	const isCorrect = answerResult?.correct ?? false;

	const handleSubmit = async () => {
		if (selectedIndex === null) {
			alert("Please select an option");
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit([selectedIndex.toString()]);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Title */}
			<div>
				<h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker mb-2">
					Identify Object in Image
				</h3>
				<p className="text-gray-800 dark:text-dark-text font-montserrat">
					Look at the image and select the correct answer
				</p>
			</div>

			{/* Image Description */}
			<div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
				<p className="text-lg text-gray-800 dark:text-dark-text font-semibold font-montserrat">{prompt}</p>
			</div>

			{/* Options */}
			<div className="space-y-3">
				{options.map((option, index) => {
					const occurrence = options
						.slice(0, index)
						.filter((o) => o === option).length;
					const isSelected = selectedIndex === index;
					const isSelectedCorrect = showResult && isSelected && isCorrect;
					const isSelectedIncorrect = showResult && isSelected && !isCorrect;

					return (
						<button
							type="button"
							key={`option-${option}-${occurrence}`}
							onClick={() => !showResult && setSelectedIndex(index)}
							disabled={showResult || isSubmitting}
							className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left font-montserrat ${
								isSelected
									? "border-gray-800 dark:border-dark-accent bg-gray-100 dark:bg-dark-surface"
									: "border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-gray-300 dark:hover:border-dark-border"
							} ${isSelectedCorrect ? "border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20" : ""} ${
								isSelectedIncorrect ? "border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20" : ""
							}`}
						>
							<p className="text-gray-800 dark:text-dark-text font-semibold">{option}</p>
						</button>
					);
				})}
			</div>

			{/* Submit Button */}
			{showResult ? (
				<div className={`overflow-hidden rounded-xl p-5 ${isCorrect ? "bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30" : "bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30"}`}>
					<div className="mb-4 flex items-start gap-3">
						<div
							className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${isCorrect ? "bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-400"}`}
						>
							{isCorrect ? "👀" : "🧠"}
						</div>
						<div>
							<p className={`text-lg font-bold font-tusker ${isCorrect ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
								{isCorrect ? "Correct read!" : "Good try"}
							</p>
							<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
								Open the explanation before heading to the next one.
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
			) : (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={selectedIndex === null || isSubmitting}
					className="w-full rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 disabled:opacity-50 font-montserrat"
				>
					{isSubmitting ? "Submitting..." : "Submit Answer"}
				</button>
			)}
		</div>
	);
}

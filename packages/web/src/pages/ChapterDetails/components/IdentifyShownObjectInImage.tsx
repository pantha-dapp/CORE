import { useState } from "react";
import { MathText } from "../../../shared/components/MathText";
import { useHapticFeedback } from "../../../shared/utils/haptics";

interface IdentifyShownObjectInImageProps {
	options: string[];
	image: {
		prompt: string;
	};
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
	onViewExplanation?: () => void;
	isExplanationLoading?: boolean;
}

export function IdentifyShownObjectInImage({
	options,
	image: { prompt },
	imageUrl,
	onSubmit,
	answerResult,
	onContinue,
	onViewExplanation,
	isExplanationLoading,
}: IdentifyShownObjectInImageProps) {
	const hapticFeedback = useHapticFeedback();
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
		<>
			<div className="space-y-6 pb-32">
				{/* Title */}
				<div>
					<h3 className="text-xl font-bold text-dark-text font-titillium mb-2">
						Identify Object in Image
					</h3>
					<p className="text-dark-text text-sm font-titillium">
						Look at the image and select the correct answer
					</p>
				</div>

				{/* Image */}
				{imageUrl ? (
					<div className="rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
						<img
							src={imageUrl}
							alt={prompt}
							className="w-full object-cover max-h-72"
						/>
						<p className="px-4 py-2 text-xs text-gray-500 dark:text-dark-muted font-montserrat text-center">
							{prompt}
						</p>
					</div>
				) : (
					<div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
						<MathText
							block
							className="text-lg text-gray-800 dark:text-dark-text font-semibold font-montserrat"
						>
							{prompt}
						</MathText>
					</div>
				)}

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
								onClick={() => {
									if (!showResult) {
										hapticFeedback.tap();
										setSelectedIndex(index);
									}
								}}
								disabled={showResult || isSubmitting}
								className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left font-montserrat ${
									isSelected
										? "border-gray-800 dark:border-dark-accent bg-gray-100 dark:bg-dark-surface"
										: "border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-gray-300 dark:hover:border-dark-border"
								} ${isSelectedCorrect ? "border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20" : ""} ${
									isSelectedIncorrect
										? "border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20"
										: ""
								}`}
							>
								<MathText
									block
									className="text-gray-800 dark:text-dark-text font-semibold font-montserrat"
								>
									{option}
								</MathText>
							</button>
						);
					})}
				</div>

				{/* Result message */}
				{showResult && (
					<div
						className={`overflow-hidden rounded-xl p-5 ${isCorrect ? "bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30" : "bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30"}`}
					>
						<div className="flex items-start gap-3">
							<div
								className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${isCorrect ? "bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-400"}`}
							>
								{isCorrect ? "👀" : "🧠"}
							</div>
							<div>
								<p
									className={`text-lg font-bold font-titillium ${isCorrect ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}
								>
									{isCorrect ? "Correct read!" : "Good try"}
								</p>
								<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
									Open the explanation before heading to the next one.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{!showResult && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={selectedIndex === null || isSubmitting}
					className={`fixed bottom-24 left-4 right-4 z-40 rounded-xl px-6 py-3 font-semibold font-montserrat transition-all ${
						selectedIndex === null
							? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
							: "bg-landing-button-primary dark:bg-dark-accent text-landing-button-light-bg dark:text-gray-900 hover:opacity-90"
					} ${isSubmitting ? "opacity-50" : ""}`}
				>
					{isSubmitting ? "Submitting..." : "Submit Answer"}
				</button>
			)}

			{showResult && (
				<div className="fixed bottom-24 left-4 right-4 z-40 space-y-2 animate-chapter-result-in">
					{onViewExplanation && (
						<button
							type="button"
							onClick={onViewExplanation}
							className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-dark-surface px-4 py-3.5 text-sm font-semibold text-gray-800 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border font-montserrat"
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
						className="w-full rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat"
					>
						Next Question →
					</button>
				</div>
			)}
		</>
	);
}

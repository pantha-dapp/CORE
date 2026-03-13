import { useState } from "react";

interface IdentifyObjectFromImagesProps {
	object: string;
	images: {
		prompt: string;
	}[];
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
	onViewExplanation?: () => void;
	isExplanationLoading?: boolean;
}

export function IdentifyObjectFromImages({
	object,
	images,
	onSubmit,
	answerResult,
	onContinue,
	onViewExplanation,
	isExplanationLoading,
}: IdentifyObjectFromImagesProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const showResult = answerResult !== null;
	const isCorrect = answerResult?.correct ?? false;

	const handleSubmit = async () => {
		if (selectedIndex === null) {
			alert("Please select an image");
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
					Identify Object from Images
				</h3>
				<p className="text-gray-800 dark:text-dark-text font-montserrat">
					Select the image that shows:{" "}
					<span className="font-semibold text-gray-900 dark:text-dark-text">{object}</span>
				</p>
			</div>

			{/* Question */}
			<div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
				<p className="text-lg text-gray-800 dark:text-dark-text font-semibold font-montserrat">
					Which image shows the "{object}"?
				</p>
			</div>

			{/* Images Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{images.map((image, index) => {
					const occurrence = images
						.slice(0, index)
						.filter((i) => i.prompt === image.prompt).length;
					const isSelected = selectedIndex === index;
					const isSelectedCorrect = showResult && isSelected && isCorrect;
					const isSelectedIncorrect = showResult && isSelected && !isCorrect;

					return (
						<button
							type="button"
							key={`image-${image.prompt}-${occurrence}`}
							onClick={() => !showResult && setSelectedIndex(index)}
							disabled={showResult || isSubmitting}
							className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
								isSelected
									? "border-gray-800 dark:border-dark-accent bg-gray-100 dark:bg-dark-surface"
									: "border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border bg-white dark:bg-dark-surface"
							} ${isSelectedCorrect ? "border-green-500 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20" : ""} ${
								isSelectedIncorrect ? "border-red-500 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20" : ""
							}`}
						>
							<div className="relative bg-gray-50 dark:bg-dark-card">
								<p className="p-3 text-gray-800 dark:text-dark-text text-sm min-h-20 flex items-center justify-center text-center font-montserrat">
									{image.prompt}
								</p>
							</div>
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
							{isCorrect ? "📸" : "🔎"}
						</div>
						<div>
							<p className={`text-lg font-bold font-tusker ${isCorrect ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
								{isCorrect ? "You spotted it!" : "Take one more look"}
							</p>
							<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
								Read the explanation, then continue when you're ready.
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

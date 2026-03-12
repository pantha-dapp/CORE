import { useState } from "react";
import Button from "../../../shared/components/Button";

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
				<h3 className="text-2xl font-bold text-white mb-2">
					Identify Object in Image
				</h3>
				<p className="text-gray-300">
					Look at the image and select the correct answer
				</p>
			</div>

			{/* Image Description */}
			<div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
				<p className="text-lg text-white font-semibold">{prompt}</p>
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
							// use option text + occurrence to create a stable key when duplicates exist
							key={`option-${option}-${occurrence}`}
							onClick={() => !showResult && setSelectedIndex(index)}
							disabled={showResult || isSubmitting}
							className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
								isSelected
									? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-400"
									: "border-gray-600 bg-gray-700/30 hover:border-gray-500"
							} ${isSelectedCorrect ? "border-green-500 bg-green-500/10 ring-green-400" : ""} ${
								isSelectedIncorrect
									? "border-red-500 bg-red-500/10 ring-red-400"
									: ""
							}`}
						>
							<p className="text-white font-semibold">{option}</p>
						</button>
					);
				})}
			</div>

			{/* Submit Button */}
			{showResult ? (
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
							{isCorrect ? "👀" : "🧠"}
						</div>
						<div>
							<p
								className={`text-lg font-black ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}
							>
								{isCorrect ? "Correct read!" : "Good try"}
							</p>
							<p className="mt-1 text-sm leading-6 text-slate-200">
								Open the explanation before heading to the next one.
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
			) : (
				<Button
					onClick={handleSubmit}
					disabled={selectedIndex === null || isSubmitting}
					className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Submitting..." : "Submit Answer"}
				</Button>
			)}
		</div>
	);
}

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
}

export function IdentifyShownObjectInImage({
	options,
	image: { prompt },
	onSubmit,
	answerResult,
	onContinue,
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
					className={`p-4 rounded-2xl border ${
						isCorrect
							? "border-green-500/40 bg-green-500/10"
							: "border-red-500/40 bg-red-500/10"
					}`}
				>
					<p
						className={`font-bold text-lg ${isCorrect ? "text-green-400" : "text-red-400"}`}
					>
						{isCorrect ? "✓ Correct!" : "✗ Incorrect"}
					</p>
					<p className="text-sm text-gray-300 mt-2">
						Your answer has been checked by the server.
					</p>
					<Button onClick={onContinue} className="w-full mt-4">
						Continue
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

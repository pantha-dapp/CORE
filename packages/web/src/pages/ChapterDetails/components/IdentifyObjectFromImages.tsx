import { useState } from "react";
import Button from "../../../shared/components/Button";

interface IdentifyObjectFromImagesProps {
	object: string;
	images: {
		prompt: string;
	}[];
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
}

export function IdentifyObjectFromImages({
	object,
	images,
	onSubmit,
	answerResult,
	onContinue,
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
				<h3 className="text-2xl font-bold text-white mb-2">
					Identify Object from Images
				</h3>
				<p className="text-gray-300">
					Select the image that shows:{" "}
					<span className="font-semibold text-blue-400">{object}</span>
				</p>
			</div>

			{/* Question */}
			<div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
				<p className="text-lg text-white font-semibold">
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
							// use image prompt + occurrence to create a stable key when duplicates exist
							key={`image-${image.prompt}-${occurrence}`}
							onClick={() => !showResult && setSelectedIndex(index)}
							disabled={showResult || isSubmitting}
							className={`rounded-lg border-2 transition-all duration-200 overflow-hidden ${
								isSelected
									? "border-blue-500 ring-2 ring-blue-400"
									: "border-gray-600 hover:border-gray-500"
							} ${isSelectedCorrect ? "border-green-500 ring-green-400 bg-green-500/10" : ""} ${
								isSelectedIncorrect
									? "border-red-500 ring-red-400 bg-red-500/10"
									: ""
							}`}
						>
							<div className="relative bg-gray-700/50">
								<p className="p-3 text-gray-300 text-sm min-h-20 flex items-center justify-center text-center">
									{image.prompt}
								</p>
							</div>
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

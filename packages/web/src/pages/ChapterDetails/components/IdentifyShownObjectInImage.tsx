import { useState } from "react";
import Button from "../../../shared/components/Button";

interface IdentifyShownObjectInImageProps {
	options: string[];
	correctOptionIndex: number;
	image: {
		prompt: string;
	};
	onSubmit: (answer: string[]) => void;
}

export function IdentifyShownObjectInImage({
	options,
	image: { prompt },
	onSubmit,
}: IdentifyShownObjectInImageProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (selectedIndex === null) {
			alert("Please select an option");
			return;
		}

		setIsSubmitting(true);
		try {
			onSubmit([selectedIndex.toString()]);
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

					return (
						<button
							type="button"
							// use option text + occurrence to create a stable key when duplicates exist
							key={`option-${option}-${occurrence}`}
							onClick={() => setSelectedIndex(index)}
							className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
								selectedIndex === index
									? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-400"
									: "border-gray-600 bg-gray-700/30 hover:border-gray-500"
							}`}
						>
							<p className="text-white font-semibold">{option}</p>
						</button>
					);
				})}
			</div>

			{/* Submit Button */}
			<Button
				onClick={handleSubmit}
				disabled={selectedIndex === null || isSubmitting}
				className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? "Submitting..." : "Submit Answer"}
			</Button>
		</div>
	);
}

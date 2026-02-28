import { useState } from "react";
import Button from "../../../shared/components/Button";

interface IdentifyObjectFromImagesProps {
	object: string;
	images: {
		prompt: string;
	}[];
	correctImageIndex: number;
	onSubmit: (answer: string[]) => void;
}

export function IdentifyObjectFromImages({
	object,
	images,
	onSubmit,
}: IdentifyObjectFromImagesProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (selectedIndex === null) {
			alert("Please select an image");
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

					return (
						<button
							type="button"
							// use image prompt + occurrence to create a stable key when duplicates exist
							key={`image-${image.prompt}-${occurrence}`}
							onClick={() => setSelectedIndex(index)}
							className={`rounded-lg border-2 transition-all duration-200 overflow-hidden ${
								selectedIndex === index
									? "border-blue-500 ring-2 ring-blue-400"
									: "border-gray-600 hover:border-gray-500"
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

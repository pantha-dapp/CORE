import { useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	topic: string;
	text: string;
	examples: string[];
	imageUrl?: string;
	onContinue: () => Promise<void>;
}

export function ExampleUses({
	topic,
	text,
	examples,
	imageUrl,
	onContinue,
}: Props) {
	const [isContinuing, setIsContinuing] = useState(false);

	async function handleContinue() {
		if (isContinuing) {
			return;
		}

		setIsContinuing(true);
		try {
			await onContinue();
		} finally {
			setIsContinuing(false);
		}
	}

	return (
		<div className="space-y-4">
			<h3 className="text-2xl font-bold">{topic}</h3>
			{imageUrl && (
				<img src={imageUrl} alt={topic} className="rounded-lg w-full" />
			)}
			<p className="text-gray-300">{text}</p>
			{examples.length > 0 && (
				<div className="bg-gray-900/50 rounded-lg p-4">
					<p className="font-semibold mb-3 text-gray-200">Examples:</p>
					<ul className="space-y-2">
						{examples.map((example) => (
							<li key={example} className="flex items-start gap-2">
								<span className="text-blue-400 mt-1">•</span>
								<span className="text-gray-300">{example}</span>
							</li>
						))}
					</ul>
				</div>
			)}
			<Button
				onClick={handleContinue}
				className="w-full mt-6"
				disabled={isContinuing}
			>
				{isContinuing ? "Loading..." : "Continue"}
			</Button>
		</div>
	);
}

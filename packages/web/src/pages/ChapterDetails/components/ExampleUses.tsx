import { useState } from "react";
import { MathText } from "../../../shared/components/MathText";

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
			<h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker">
				{topic}
			</h3>
			{imageUrl && (
				<img src={imageUrl} alt={topic} className="rounded-lg w-full" />
			)}
			<MathText
				block
				className="text-gray-800 dark:text-dark-text font-montserrat"
			>
				{text}
			</MathText>
			{examples.length > 0 && (
				<div className="bg-gray-100 dark:bg-dark-surface rounded-xl p-4">
					<p className="font-semibold mb-3 text-gray-700 dark:text-dark-muted font-montserrat">
						Examples:
					</p>
					<ul className="space-y-2">
						{examples.map((example) => (
							<li key={example} className="flex items-start gap-2">
								<span className="text-gray-600 dark:text-dark-muted mt-1">
									•
								</span>
								<MathText className="text-gray-800 dark:text-dark-text font-montserrat">
									{example}
								</MathText>
							</li>
						))}
					</ul>
				</div>
			)}
			<button
				type="button"
				onClick={handleContinue}
				disabled={isContinuing}
				className="w-full mt-6 rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 disabled:opacity-50 font-montserrat"
			>
				{isContinuing ? "Loading..." : "Continue"}
			</button>
		</div>
	);
}

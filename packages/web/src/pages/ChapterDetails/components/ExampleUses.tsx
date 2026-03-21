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
			<h3 className="text-xl font-bold text-dark-text font-titillium">
				{topic}
			</h3>
			{imageUrl && (
				<img
					src={imageUrl}
					alt={topic}
					className="rounded-xl w-full border border-dark-border/50"
				/>
			)}
			<MathText block className="text-dark-text font-titillium">
				{text}
			</MathText>
			{examples.length > 0 && (
				<div className="bg-dark-surface rounded-xl p-4 border border-dark-border/50">
					<p className="font-semibold mb-2 text-dark-muted font-titillium text-sm">
						Examples:
					</p>
					<ul className="space-y-2">
						{examples.map((example) => (
							<li key={example} className="flex items-start gap-2">
								<span className="text-dark-accent mt-1">•</span>
								<MathText className="text-dark-text font-titillium text-sm">
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
				className="w-full mt-6 rounded-lg bg-dark-accent px-4 py-2.5 text-sm font-semibold text-dark-bg hover:opacity-90 disabled:opacity-50 font-titillium transition-opacity"
			>
				{isContinuing ? "Loading..." : "Continue"}
			</button>
		</div>
	);
}

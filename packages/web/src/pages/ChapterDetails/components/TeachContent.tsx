import { marked } from "marked";
import { useState } from "react";
import { renderMathText } from "../../../shared/utils/math";
import "katex/dist/katex.min.css";

interface Props {
	topic: string;
	markdown: string;
	imageUrl?: string;
	onContinue: () => Promise<void>;
}

export function TeachContent({ topic, markdown, imageUrl, onContinue }: Props) {
	const htmlContent = marked(renderMathText(markdown));
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
		<>
			<div className="space-y-4 pb-32">
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
				<div
					className="text-dark-text leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-dark-accent font-titillium"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: kana pdad
					dangerouslySetInnerHTML={{ __html: htmlContent }}
				/>
			</div>
			<button
				type="button"
				onClick={handleContinue}
				disabled={isContinuing}
				className="fixed bottom-24 left-4 right-4 z-40 rounded-lg bg-dark-accent px-4 py-2.5 text-sm font-semibold text-dark-bg hover:opacity-90 disabled:opacity-50 font-titillium transition-opacity"
			>
				{isContinuing ? "Loading..." : "Continue"}
			</button>
		</>
	);
}

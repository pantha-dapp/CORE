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
		<div className="space-y-4">
			<h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker">
				{topic}
			</h3>
			{imageUrl && (
				<img src={imageUrl} alt={topic} className="rounded-lg w-full" />
			)}
			<div
				className="text-gray-800 dark:text-dark-text leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-dark-accent font-montserrat"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: kana pdad
				dangerouslySetInnerHTML={{ __html: htmlContent }}
			/>
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

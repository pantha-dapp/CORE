import { marked } from "marked";
import { useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	topic: string;
	markdown: string;
	imageUrl?: string;
	onContinue: () => Promise<void>;
}

export function TeachContent({ topic, markdown, imageUrl, onContinue }: Props) {
	const htmlContent = marked(markdown);
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
			<div className="prose prose-invert max-w-none">
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content from AI */}
				<div dangerouslySetInnerHTML={{ __html: htmlContent }} />
			</div>
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

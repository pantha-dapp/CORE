import Button from "../../../shared/components/Button";

interface Props {
	topic: string;
	markdown: string;
	imageUrl?: string;
	onContinue: () => void;
}

export function TeachContent({ topic, markdown, imageUrl, onContinue }: Props) {
	return (
		<div className="space-y-4">
			<h3 className="text-2xl font-bold">{topic}</h3>
			{imageUrl && (
				<img src={imageUrl} alt={topic} className="rounded-lg w-full" />
			)}
			<div className="prose prose-invert max-w-none">
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content from AI */}
				<div dangerouslySetInnerHTML={{ __html: markdown }} />
			</div>
			<Button onClick={onContinue} className="w-full mt-6">
				Continue
			</Button>
		</div>
	);
}

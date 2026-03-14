import "katex/dist/katex.min.css";
import { renderMathText } from "../utils/math";

interface Props {
	children: string;
	className?: string;
	/** Render as a block-level element instead of an inline span */
	block?: boolean;
}

/**
 * Renders a plain-text string that may contain LaTeX math delimiters:
 *   - Inline:  \( ... \)
 *   - Display: \[ ... \]
 *
 * Falls back to the raw string for any segment that cannot be parsed.
 */
export function MathText({ children, className, block }: Props) {
	const html = renderMathText(children);

	if (block) {
		return (
			<p
				className={className}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: math rendering
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		);
	}

	return (
		<span
			className={className}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: math rendering
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

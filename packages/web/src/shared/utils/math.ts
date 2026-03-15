import katex from "katex";

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Simple markdown processing for common inline formatting:
 * - *text* → <em>text</em>
 * - **text** → <strong>text</strong>
 * - __text__ → <strong>text</strong>
 * - _text_ → <em>text</em>
 *
 * Note: Only applies to text that doesn't contain $ or \ (to avoid interfering with math)
 */
function processMarkdown(text: string): string {
	// Don't process markdown if text contains math delimiters
	if (/\$|\\/.test(text)) {
		return text;
	}

	// Process **bold** and __bold__
	text = text
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/__([^_]+)__/g, "<strong>$1</strong>");

	// Process *italic* and _italic_
	text = text
		.replace(/\*([^*]+)\*/g, "<em>$1</em>")
		.replace(/_([^_]+)_/g, "<em>$1</em>");

	return text;
}

/**
 * Converts a plain-text string that may contain LaTeX math delimiters
 * (`\(...\)` for inline, `\[...\]` for display) into an HTML string
 * with properly rendered KaTeX math.
 *
 * Non-math segments are HTML-escaped so the result is safe to inject
 * via dangerouslySetInnerHTML.
 */
/**
 * Returns true when a string contains bare LaTeX (e.g. `\frac{2}{x}`, `x^{2}`)
 * but has NO explicit `\(…\)` / `\[…\]` delimiters.
 * Used to decide whether to wrap the whole string as inline math.
 */
function isBareLatex(text: string): boolean {
	// Already has explicit delimiters → not "bare"
	if (/\$|\\\(|\\\[/.test(text)) return false;
	// Contains a LaTeX command (\frac, \to, \infty …) or braced super/subscript
	return /\\[a-zA-Z]+|\^{|_{/.test(text);
}

export function renderMathText(text: string): string {
	// Bare LaTeX (no delimiters) — render the whole string as inline math
	if (isBareLatex(text)) {
		try {
			return katex.renderToString(text, {
				displayMode: false,
				throwOnError: false,
				output: "html",
			});
		} catch {
			return processMarkdown(escapeHtml(text));
		}
	}

	// Matches:
	// - \[...\] (display, LaTeX style)
	// - \(...\) (inline, LaTeX style)
	// - $$...$$ (display, Markdown style) - must come before $ to avoid partial matches
	// - $...$ (inline, Markdown style)
	// All allow newlines within the delimiters
	const regex =
		/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
	const parts: string[] = [];
	let lastIndex = 0;

	for (let match = regex.exec(text); match !== null; match = regex.exec(text)) {
		// Plain text before this math segment — HTML-escape it, then apply markdown
		if (match.index > lastIndex) {
			const plainText = text.slice(lastIndex, match.index);
			parts.push(processMarkdown(escapeHtml(plainText)));
		}

		// Determine which delimiter was matched and if it's display mode
		let isDisplay = false;
		let mathContent = "";

		if (match[1] !== undefined) {
			// $$ ... $$ (display, Markdown)
			isDisplay = true;
			mathContent = match[1];
		} else if (match[2] !== undefined) {
			// $ ... $ (inline, Markdown)
			isDisplay = false;
			mathContent = match[2];
		} else if (match[3] !== undefined) {
			// \[ ... \] (display, LaTeX)
			isDisplay = true;
			mathContent = match[3];
		} else if (match[4] !== undefined) {
			// \( ... \) (inline, LaTeX)
			isDisplay = false;
			mathContent = match[4];
		}

		try {
			parts.push(
				katex.renderToString(mathContent, {
					displayMode: isDisplay,
					throwOnError: false,
					output: "html",
				}),
			);
		} catch {
			// Fallback: show raw delimiters escaped
			parts.push(escapeHtml(match[0]));
		}

		lastIndex = regex.lastIndex;
	}

	// Remaining plain text
	if (lastIndex < text.length) {
		parts.push(processMarkdown(escapeHtml(text.slice(lastIndex))));
	}

	return parts.join("");
}

/**
 * Same as renderMathText but works on an already-rendered HTML string
 * (e.g. from `marked`). It does NOT HTML-escape the non-math portions
 * since those are already valid HTML.
 */
export function renderMathInHtml(html: string): string {
	const regex = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
	return html.replace(regex, (match, display, inline) => {
		const isDisplay = display !== undefined;
		const mathContent = isDisplay ? display : inline;
		try {
			return katex.renderToString(mathContent, {
				displayMode: isDisplay,
				throwOnError: false,
				output: "html",
			});
		} catch {
			return match;
		}
	});
}

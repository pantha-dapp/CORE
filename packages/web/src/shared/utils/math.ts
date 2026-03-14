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
	if (/\\\(|\\\[/.test(text)) return false;
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
			return escapeHtml(text);
		}
	}

	// Matches \[...\] (display) or \(...\) (inline), both allowing newlines
	const regex = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
	const parts: string[] = [];
	let lastIndex = 0;

	for (let match = regex.exec(text); match !== null; match = regex.exec(text)) {
		// Plain text before this math segment — HTML-escape it
		if (match.index > lastIndex) {
			parts.push(escapeHtml(text.slice(lastIndex, match.index)));
		}

		const isDisplay = match[1] !== undefined;
		const mathContent = isDisplay ? match[1] : match[2];

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
		parts.push(escapeHtml(text.slice(lastIndex)));
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

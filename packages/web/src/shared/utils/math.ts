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

/**
 * Returns true when the content between $...$ delimiters looks like actual math.
 * Prevents currency signs like "$45 per month … $22.50" from being swallowed as
 * a single math expression — which strips all spaces and merges words together.
 */
function looksLikeMath(content: string): boolean {
	const trimmed = content.trim();
	// Contains a LaTeX command (e.g. \times, \frac, \log) → definitely math
	if (/\\[a-zA-Z]+/.test(trimmed)) return true;
	// Contains unambiguously-math symbols.
	// Intentionally excludes - * / ~ because those appear in ordinary prose
	// (hyphens, "and/or", emphasis, approximation) and would cause long
	// prose phrases between two currency signs to be rendered as math,
	// which strips all whitespace and merges words together.
	if (/[=+^_{}<>|]/.test(trimmed)) return true;
	// Single token with no whitespace (e.g. $x$, $n$, $42$, $3.14$) → math
	if (!/\s/.test(trimmed)) return true;
	// Multiple space-separated words with no unambiguous math syntax → prose
	return false;
}

/**
 * Extracts pre-rendered KaTeX <span class="katex">…</span> blocks from text,
 * replacing each with a control-character placeholder so they survive
 * HTML-escaping and regex processing unchanged.
 *
 * Returns the modified text and the extracted blocks for later restoration.
 */
function extractKatexBlocks(text: string): { text: string; blocks: string[] } {
	if (!text.includes('<span class="katex">')) {
		return { text, blocks: [] };
	}

	const blocks: string[] = [];
	let result = "";
	let pos = 0;
	const MARKER = '<span class="katex">';

	while (pos < text.length) {
		const start = text.indexOf(MARKER, pos);
		if (start === -1) {
			result += text.slice(pos);
			break;
		}

		result += text.slice(pos, start);

		// Walk forward counting <span> depth to find the matching </span>
		let depth = 0;
		let i = start;
		while (i < text.length) {
			if (text[i] === "<") {
				if (text.startsWith("</span>", i)) {
					depth--;
					i += 7;
					if (depth === 0) break;
				} else if (text.startsWith("<span", i)) {
					depth++;
					const tagEnd = text.indexOf(">", i);
					i = tagEnd === -1 ? i + 1 : tagEnd + 1;
				} else {
					i++;
				}
			} else {
				i++;
			}
		}

		// SOH/STX chars: not HTML-escaped, not matched by math regexes
		result += `${String.fromCharCode(1)}${blocks.length}${String.fromCharCode(2)}`;
		blocks.push(text.slice(start, i));
		pos = i;
	}

	return { text: result, blocks };
}

export function renderMathText(text: string): string {
	// Protect any pre-rendered KaTeX HTML so it passes through unchanged
	const { text: processedText, blocks } = extractKatexBlocks(text);

	let result: string;

	// Bare LaTeX (no delimiters) — render the whole string as inline math
	if (isBareLatex(processedText)) {
		try {
			result = katex.renderToString(processedText, {
				displayMode: false,
				throwOnError: false,
				output: "html",
			});
		} catch {
			result = processMarkdown(escapeHtml(processedText));
		}
	} else {
		// Matches:
		// - $$...$$ (display, Markdown style) — must come before $ to avoid partial matches
		// - $...$ (inline, Markdown style)
		// - \[...\] (display, LaTeX style)
		// - \(...\) (inline, LaTeX style)
		// All allow newlines within the delimiters
		const regex =
			/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
		const parts: string[] = [];
		let lastIndex = 0;

		for (
			let match = regex.exec(processedText);
			match !== null;
			match = regex.exec(processedText)
		) {
			// Plain text before this math segment — HTML-escape it, then apply markdown
			if (match.index > lastIndex) {
				parts.push(
					processMarkdown(
						escapeHtml(processedText.slice(lastIndex, match.index)),
					),
				);
			}

			// Determine which delimiter was matched and if it's display mode
			let isDisplay = false;
			let mathContent = "";
			let skipMath = false;

			if (match[1] !== undefined) {
				// $$ ... $$ (display, Markdown)
				isDisplay = true;
				mathContent = match[1];
			} else if (match[2] !== undefined) {
				// $ ... $ (inline, Markdown) — only render if it looks like real math.
				// Currency signs like "$45 per month … $22.50" must NOT be swallowed here;
				// doing so strips all spaces inside KaTeX and merges the words together.
				if (looksLikeMath(match[2])) {
					isDisplay = false;
					mathContent = match[2];
				} else {
					skipMath = true;
				}
			} else if (match[3] !== undefined) {
				// \[ ... \] (display, LaTeX)
				isDisplay = true;
				mathContent = match[3];
			} else if (match[4] !== undefined) {
				// \( ... \) (inline, LaTeX)
				isDisplay = false;
				mathContent = match[4];
			}

			if (skipMath) {
				// Treat the entire $...$ span as plain text
				parts.push(processMarkdown(escapeHtml(match[0])));
			} else {
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
			}

			lastIndex = regex.lastIndex;
		}

		// Remaining plain text
		if (lastIndex < processedText.length) {
			parts.push(processMarkdown(escapeHtml(processedText.slice(lastIndex))));
		}

		result = parts.join("");
	}

	// Restore pre-rendered KaTeX blocks
	if (blocks.length > 0) {
		const restoreRe = new RegExp(
			`${String.fromCharCode(1)}(\\d+)${String.fromCharCode(2)}`,
			"g",
		);
		result = result.replace(
			restoreRe,
			(_, n) => blocks[Number.parseInt(n, 10)],
		);
	}

	return result;
}

/**
 * Renders math expressions inside an already-parsed HTML string
 * (e.g. the output of `marked`). Does NOT HTML-escape non-math portions.
 *
 * Handles all four delimiters:
 *   \[...\]  (display)   \(...\)  (inline)
 *   $$...$$  (display)   $...$    (inline, only when looksLikeMath)
 *
 * Pre-rendered KaTeX `<span class="katex">` blocks are left untouched because
 * they contain none of the above delimiter sequences.
 */
export function renderMathInHtml(html: string): string {
	// $$...$$ must come before $...$ to avoid partial matches
	const regex =
		/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;
	return html.replace(
		regex,
		(match, displayDollar, inlineDollar, displayBracket, inlineParen) => {
			let isDisplay = false;
			let mathContent: string;

			if (displayDollar !== undefined) {
				isDisplay = true;
				mathContent = displayDollar;
			} else if (inlineDollar !== undefined) {
				// Only treat as math when the content looks like real math.
				// Prose between two currency signs (e.g. "$45 per month…$22.50")
				// must NOT be passed to KaTeX — it strips whitespace and merges words.
				if (!looksLikeMath(inlineDollar)) return match;
				isDisplay = false;
				mathContent = inlineDollar;
			} else if (displayBracket !== undefined) {
				isDisplay = true;
				mathContent = displayBracket;
			} else {
				isDisplay = false;
				mathContent = inlineParen as string;
			}

			try {
				return katex.renderToString(mathContent, {
					displayMode: isDisplay,
					throwOnError: false,
					output: "html",
				});
			} catch {
				return match;
			}
		},
	);
}

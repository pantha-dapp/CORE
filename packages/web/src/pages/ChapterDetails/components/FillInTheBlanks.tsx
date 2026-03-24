import { type ReactNode, useMemo, useRef, useState } from "react";
import { MathText } from "../../../shared/components/MathText";

import { useHapticFeedback } from "../../../shared/utils/haptics";

interface Props {
	wrongOptions?: string[];
	words: string[];
	answers: string[];
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
	onViewExplanation?: () => void;
	isExplanationLoading?: boolean;
}

export function FillInTheBlanks({
	imageUrl,
	onSubmit,
	answerResult,
	onContinue,
	onViewExplanation,
	isExplanationLoading,
	words,
	wrongOptions = [],
}: Props) {
	// Scan every character of every word token for $N patterns — not just exact-match
	// tokens. The AI sometimes embeds placeholders inside punctuation, e.g. "( $1 , $2 )."
	// as a single words[] element. We need Math.max of unique slot numbers, not a count.
	const blankCount = useMemo(() => {
		const nums: number[] = [];
		for (const w of words) {
			for (const m of w.matchAll(/\$(\d+)/g)) {
				nums.push(parseInt(m[1], 10));
			}
		}
		return nums.length === 0 ? 0 : Math.max(...nums);
	}, [words]);

	const hapticFeedback = useHapticFeedback();
	const [userInputs, setUserInputs] = useState<string[]>(
		Array(blankCount).fill(""),
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [flyingChip, setFlyingChip] = useState<{
		text: string;
		from: { x: number; y: number; w: number; h: number };
		to: { x: number; y: number; w: number; h: number };
		phase: "positioned" | "flying";
	} | null>(null);
	const [hiddenOptionId, setHiddenOptionId] = useState<number | null>(null);
	const [hiddenBlankIndex, setHiddenBlankIndex] = useState<number | null>(null);
	const wordBankRef = useRef<HTMLDivElement>(null);
	const ANIMATION_MS = 300;
	const showResult = answerResult !== null;
	const isCorrect = answerResult?.correct ?? false;

	// Attach a stable id (original position before shuffle) so React keys are
	// never based on the array index. wrongOptions already includes correct answers
	// mixed in by the server.
	const availableOptions = useMemo(() => {
		return wrongOptions
			.map((v, id) => ({ id, v }))
			.sort(() => Math.random() - 0.5);
	}, [wrongOptions]);

	// [].every() is vacuously true, so when blankCount=0 (no placeholders in words)
	// the submit button is enabled immediately rather than stuck disabled forever.
	const allFilled = userInputs.every((input) => input.trim().length > 0);

	// Remaining options = availableOptions minus whatever is already placed in blanks
	const remainingOptions = useMemo(() => {
		const remaining = [...availableOptions];
		for (const ans of userInputs) {
			if (ans.trim().length === 0) continue;
			const idx = remaining.findIndex(({ v }) => v === ans);
			if (idx >= 0) remaining.splice(idx, 1);
		}
		return remaining;
	}, [availableOptions, userInputs]);

	// Click a word-bank chip → fly it into the next empty blank
	function selectOption(option: string, optionId: number, srcRect: DOMRect) {
		if (showResult || isSubmitting || flyingChip) return;
		const firstEmpty = userInputs.findIndex((v) => v.trim().length === 0);
		if (firstEmpty === -1) return;
		hapticFeedback.tap();

		const blankEl = document.querySelector(
			`[data-blank-index="${firstEmpty}"]`,
		) as HTMLElement | null;

		if (!blankEl) {
			setUserInputs((prev) => {
				const next = [...prev];
				next[firstEmpty] = option;
				return next;
			});
			return;
		}

		const dstRect = blankEl.getBoundingClientRect();
		setHiddenOptionId(optionId);
		setFlyingChip({
			text: option,
			from: {
				x: srcRect.left,
				y: srcRect.top,
				w: srcRect.width,
				h: srcRect.height,
			},
			to: {
				x: dstRect.left + (dstRect.width - srcRect.width) / 2,
				y: dstRect.top + (dstRect.height - srcRect.height) / 2,
				w: srcRect.width,
				h: srcRect.height,
			},
			phase: "positioned",
		});

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setFlyingChip((prev) => (prev ? { ...prev, phase: "flying" } : null));
			});
		});

		setTimeout(() => {
			setUserInputs((prev) => {
				const next = [...prev];
				next[firstEmpty] = option;
				return next;
			});
			setFlyingChip(null);
			setHiddenOptionId(null);
		}, ANIMATION_MS);
	}

	// Click a filled blank → fly the answer back to the word bank
	function clearBlank(blankIndex: number, srcRect: DOMRect) {
		if (showResult || isSubmitting || flyingChip) return;
		hapticFeedback.tap();

		const bankEl = wordBankRef.current;
		if (!bankEl) {
			setUserInputs((prev) => {
				const next = [...prev];
				next[blankIndex] = "";
				return next;
			});
			return;
		}

		const dstRect = bankEl.getBoundingClientRect();
		const text = userInputs[blankIndex];
		setHiddenBlankIndex(blankIndex);
		setFlyingChip({
			text,
			from: {
				x: srcRect.left,
				y: srcRect.top,
				w: srcRect.width,
				h: srcRect.height,
			},
			to: {
				x: dstRect.left + dstRect.width / 2 - srcRect.width / 2,
				y: dstRect.top + dstRect.height / 2 - srcRect.height / 2,
				w: srcRect.width,
				h: srcRect.height,
			},
			phase: "positioned",
		});

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setFlyingChip((prev) => (prev ? { ...prev, phase: "flying" } : null));
			});
		});

		setTimeout(() => {
			setUserInputs((prev) => {
				const next = [...prev];
				next[blankIndex] = "";
				return next;
			});
			setFlyingChip(null);
			setHiddenBlankIndex(null);
		}, ANIMATION_MS);
	}

	async function handleSubmit() {
		if (!allFilled) return;

		setIsSubmitting(true);

		try {
			await onSubmit(userInputs);
		} catch (error) {
			console.error("Error submitting fill in the blanks:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	// ── Degenerate case: AI generated no $N placeholders ────────────────────────
	// The server strips the real answers before sending to client, leaving
	// content.answers = []. When blankCount = 0 the correct server-side check is
	// jsonStringify([]) === jsonStringify([]) → true, so we just need to submit [].
	// Show a simple "Continue" card so the user is not stuck with a broken UI.
	if (blankCount === 0) {
		return (
			<>
				<div className="space-y-6 pb-32">
					<h3 className="text-xl font-bold text-dark-text font-titillium">
						Fill in the Blanks
					</h3>
					<div className="bg-amber-900/20 dark:border dark:border-amber-500/30 p-5 rounded-xl text-center space-y-3">
						<p className="text-amber-400 text-sm font-medium font-titillium">
							⚠️ This question couldn't be displayed properly.
						</p>
						<p className="text-dark-muted text-sm font-titillium">
							Tap Continue to move on — it won't affect your progress.
						</p>
					</div>
					{showResult && (
						<div className="overflow-hidden rounded-xl bg-dark-success/10 dark:border dark:border-dark-success/30 p-5">
							<p className="text-lg font-bold text-dark-success font-titillium">
								Rendered safely
							</p>
							<p className="mt-2 text-sm leading-6 text-dark-muted font-titillium">
								This question was skipped because it could not be rendered.
							</p>
						</div>
					)}
				</div>
				{!showResult && (
					<button
						type="button"
						onClick={() => onSubmit([])}
						className="fixed bottom-24 left-4 right-4 z-40 rounded-lg bg-dark-accent px-4 py-2.5 text-sm font-semibold text-dark-bg hover:opacity-90 font-titillium"
					>
						Submit Answer
					</button>
				)}
				{showResult && (
					<div className="fixed bottom-24 left-4 right-4 z-40 space-y-2 animate-chapter-result-in">
						{onViewExplanation && (
							<button
								type="button"
								onClick={onViewExplanation}
								className="w-full flex items-center justify-center gap-2 rounded-lg bg-dark-surface px-4 py-2.5 text-sm font-semibold text-dark-text hover:bg-dark-border font-titillium"
							>
								<span>💡</span>
								<span>
									{isExplanationLoading
										? "Loading explanation…"
										: "View Explanation"}
								</span>
							</button>
						)}
						<button
							type="button"
							onClick={onContinue}
							className="w-full rounded-lg bg-dark-accent px-4 py-2.5 text-sm font-semibold text-dark-bg hover:opacity-90 font-titillium"
						>
							Next Question →
						</button>
					</div>
				)}
			</>
		);
	}

	return (
		<>
			{" "}
			<div className="space-y-6 pb-32">
				{" "}
				<h3 className="text-xl font-bold text-dark-text font-titillium">
					Fill in the Blanks
				</h3>
				{imageUrl && (
					<img
						src={imageUrl}
						alt="Question"
						className="rounded-xl w-full border border-dark-border/50"
					/>
				)}
				{/* Sentence with blanks */}
				<div className="bg-dark-surface border border-dark-border/50 p-5 rounded-xl text-base leading-loose">
					{words.flatMap((word, wordIdx) => {
						// Split each token by any embedded $N patterns so that a single element
						// like "( $1 , $2 )." is rendered as text + blank + text + blank + text.
						const parts: ReactNode[] = [];
						const regex = /\$(\d+)/g;
						let lastIndex = 0;
						let foundAny = false;

						for (
							let match = regex.exec(word);
							match !== null;
							match = regex.exec(word)
						) {
							foundAny = true;
							// Plain text before this placeholder
							if (match.index > lastIndex) {
								parts.push(
									<span
										key={`w-${wordIdx}-t-${lastIndex}`}
										className="text-gray-800 dark:text-dark-text"
									>
										{word.slice(lastIndex, match.index)}
									</span>,
								);
							}
							// Blank button for this $N
							const blankIndex = parseInt(match[1], 10) - 1;
							const userAnswer = userInputs[blankIndex] ?? "";
							const isFilled = userAnswer.trim().length > 0;
							const isCorrect = showResult && isFilled;
							parts.push(
								<button
									key={`blank-${wordIdx}-${match[1]}`}
									type="button"
									data-blank-index={blankIndex}
									onClick={(e) =>
										clearBlank(
											blankIndex,
											e.currentTarget.getBoundingClientRect(),
										)
									}
									disabled={
										showResult ||
										isSubmitting ||
										!isFilled ||
										flyingChip !== null
									}
									className={`inline-flex items-center justify-center mx-1 px-3 py-1 min-w-28 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus:outline-none transition-colors font-semibold font-titillium btn-press-zoom ${
										isCorrect
											? "border-green-500 dark:border-green-400 text-green-600 dark:text-green-400"
											: isFilled && hiddenBlankIndex !== blankIndex
												? "border-dark-accent text-dark-text hover:border-dark-text"
												: "border-dark-border text-dark-muted"
									}`}
								>
									{isFilled && hiddenBlankIndex !== blankIndex
										? userAnswer
										: "___"}
								</button>,
							);
							lastIndex = regex.lastIndex;
						}

						// Remaining text after the last placeholder (or the full word if no $N found)
						const tail = word.slice(lastIndex);
						if (tail) {
							const occ = words
								.slice(0, wordIdx)
								.filter((w) => w === word).length;
							parts.push(
								<MathText
									key={`w-${wordIdx}-tail-${occ}`}
									className="text-dark-text"
								>
									{`${tail} `}
								</MathText>,
							);
						} else if (foundAny) {
							// Token was entirely placeholder(s) — add a trailing space.
							// Key uses word content + occurrence count to avoid lint warnings.
							const spOcc = words
								.slice(0, wordIdx)
								.filter((w) => w === word).length;
							parts.push(
								<span key={`w-${word}-${spOcc}-sp`} aria-hidden>
									{" "}
								</span>,
							);
						}

						return parts;
					})}
				</div>
				{/* Word bank – click to place; placed options disappear until the blank is cleared */}
				{availableOptions.length > 0 && (
					<div className="bg-dark-surface border border-dark-border/50 p-4 rounded-xl">
						<p className="text-[10px] font-semibold uppercase tracking-wider text-dark-muted font-titillium mb-3">
							Word bank
						</p>
						<div ref={wordBankRef} className="flex flex-wrap gap-2">
							{remainingOptions.map(({ id, v }) => (
								<button
									key={`hint-${id}`}
									type="button"
									onClick={(e) =>
										selectOption(v, id, e.currentTarget.getBoundingClientRect())
									}
									disabled={showResult || isSubmitting || flyingChip !== null}
									className={`px-3 py-1.5 rounded-lg text-sm bg-dark-card border border-dark-border text-dark-text hover:bg-dark-border hover:border-dark-accent transition-colors font-titillium btn-press-zoom ${hiddenOptionId === id ? "invisible" : ""}`}
								>
									{v}
								</button>
							))}
						</div>
					</div>
				)}
				{/* Result message */}
				{showResult && (
					<div
						className={`overflow-hidden rounded-xl p-4 ${isCorrect ? "bg-dark-success/10 border border-dark-success/30" : "bg-red-900/20 border border-red-500/30"}`}
					>
						<div className="flex items-start gap-3">
							<div
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${isCorrect ? "bg-dark-success/20 text-dark-success" : "bg-red-800/40 text-red-400"}`}
							>
								{isCorrect ? "📝" : "🔤"}
							</div>
							<div>
								<p
									className={`font-bold font-titillium text-base ${isCorrect ? "text-dark-success" : "text-red-400"}`}
								>
									{isCorrect ? "Well filled!" : "Almost there"}
								</p>
								<p className="mt-0.5 text-sm text-dark-muted font-titillium">
									Use the explanation to understand the missing words, then
									continue.
								</p>
							</div>
						</div>
					</div>
				)}
				{/* Flying chip overlay for word-bank ↔ blank animations */}
				{flyingChip && (
					<div
						className="fixed z-9999 pointer-events-none"
						style={{
							left:
								flyingChip.phase === "flying"
									? flyingChip.to.x
									: flyingChip.from.x,
							top:
								flyingChip.phase === "flying"
									? flyingChip.to.y
									: flyingChip.from.y,
							transition:
								flyingChip.phase === "flying"
									? `left ${ANIMATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1), top ${ANIMATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
									: "none",
						}}
					>
						<span className="inline-block px-3 py-1 rounded-full text-sm bg-white dark:bg-dark-card border border-purple-400 dark:border-dark-accent text-gray-800 dark:text-dark-text font-semibold font-montserrat shadow-lg shadow-purple-500/20 dark:shadow-black/30">
							{flyingChip.text}
						</span>
					</div>
				)}
			</div>
			{!showResult && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={!allFilled || isSubmitting}
					className={`fixed bottom-24 left-4 right-4 z-40 rounded-lg px-4 py-2.5 text-sm font-semibold font-titillium transition-all btn-press-zoom ${
						!allFilled || isSubmitting
							? "bg-dark-surface text-dark-muted cursor-not-allowed"
							: "bg-dark-accent text-dark-bg hover:opacity-90"
					} ${isSubmitting ? "opacity-50" : ""}`}
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</button>
			)}
			{showResult && (
				<div className="fixed bottom-24 left-4 right-4 z-40 space-y-2 animate-chapter-result-in">
					{onViewExplanation && (
						<button
							type="button"
							onClick={onViewExplanation}
							className="w-full flex items-center justify-center gap-2 rounded-lg bg-dark-surface px-3 py-2.5 text-sm font-semibold text-dark-text hover:bg-dark-border font-titillium transition-colors btn-press-zoom"
						>
							<span>💡</span>
							<span>
								{isExplanationLoading
									? "Loading explanation…"
									: "View Explanation"}
							</span>
						</button>
					)}
					<button
						type="button"
						onClick={onContinue}
						className="w-full rounded-lg bg-dark-accent px-4 py-2.5 text-sm font-semibold text-dark-bg hover:opacity-90 font-titillium transition-opacity btn-press-zoom"
					>
						Next Question →
					</button>
				</div>
			)}
		</>
	);
}

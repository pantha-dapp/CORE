import { type ReactNode, useMemo, useState } from "react";

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

	const [userInputs, setUserInputs] = useState<string[]>(
		Array(blankCount).fill(""),
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
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

	// Click a word-bank chip → fill the next empty blank
	function selectOption(option: string) {
		if (showResult || isSubmitting) return;
		const firstEmpty = userInputs.findIndex((v) => v.trim().length === 0);
		if (firstEmpty === -1) return;
		const next = [...userInputs];
		next[firstEmpty] = option;
		setUserInputs(next);
	}

	// Click a filled blank → return its answer to the word bank
	function clearBlank(blankIndex: number) {
		if (showResult || isSubmitting) return;
		const next = [...userInputs];
		next[blankIndex] = "";
		setUserInputs(next);
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
			<div className="space-y-6">
				<h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker">Fill in the Blanks</h3>
				<div className="bg-amber-50 dark:bg-amber-900/20 dark:border dark:border-amber-500/30 p-5 rounded-xl text-center space-y-3">
					<p className="text-amber-800 dark:text-amber-400 text-sm font-medium font-montserrat">
						⚠️ This question couldn't be displayed properly.
					</p>
					<p className="text-gray-600 dark:text-dark-muted text-sm font-montserrat">
						Tap Continue to move on — it won't affect your progress.
					</p>
				</div>
				{showResult ? (
					<div className="overflow-hidden rounded-xl bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30 p-5">
						<p className="text-lg font-bold text-green-800 dark:text-green-400 font-tusker">
							Rendered safely
						</p>
						<p className="mt-2 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
							This question was skipped because it could not be rendered.
						</p>
						{onViewExplanation && (
							<button
								type="button"
								onClick={onViewExplanation}
								className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-dark-surface px-4 py-3.5 text-sm font-semibold text-gray-800 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border font-montserrat"
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
							className="mt-3 w-full rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat"
						>
							Next Question →
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={() => onSubmit([])}
						className="w-full rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat"
					>
						Submit Answer
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h3 className="text-2xl font-bold text-gray-900 font-tusker">Fill in the Blanks</h3>

			{imageUrl && (
				<img src={imageUrl} alt="Question" className="rounded-lg w-full" />
			)}

			{/* Sentence with blanks */}
			<div className="bg-gray-100 p-6 rounded-xl text-lg leading-loose">
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
								onClick={() => clearBlank(blankIndex)}
								disabled={showResult || isSubmitting || !isFilled}
								className={`inline-flex items-center justify-center mx-1 px-3 py-1 min-w-28 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus:outline-none transition-colors font-semibold font-montserrat ${
									isCorrect
										? "border-green-500 dark:border-green-400 text-green-600 dark:text-green-400"
										: isFilled
											? "border-gray-800 dark:border-dark-accent text-gray-800 dark:text-dark-text hover:border-red-500 dark:hover:border-red-400 hover:text-red-600 dark:hover:text-red-400"
											: "border-gray-400 dark:border-dark-border text-gray-400 dark:text-dark-muted"
								}`}
							>
								{isFilled ? userAnswer : "___"}
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
							<span key={`w-${wordIdx}-tail-${occ}`} className="text-gray-800 dark:text-dark-text">
								{tail}{" "}
							</span>,
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
				<div className="bg-gray-100 dark:bg-dark-surface p-5 rounded-xl">
					<h4 className="text-xs font-semibold text-gray-600 dark:text-dark-muted uppercase tracking-wide mb-3 font-montserrat">
						💡 Word Bank
					</h4>
					<div className="flex flex-wrap gap-2">
						{remainingOptions.map(({ id, v }) => (
							<button
								key={`hint-${id}`}
								type="button"
								onClick={() => selectOption(v)}
								disabled={showResult || isSubmitting}
								className="px-3 py-1 rounded-full text-sm bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border text-gray-800 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border hover:border-gray-400 dark:hover:border-dark-accent transition-colors font-montserrat"
							>
								{v}
							</button>
						))}
					</div>
				</div>
			)}

			{!showResult && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={!allFilled || isSubmitting}
					className="w-full rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 disabled:opacity-50 font-montserrat"
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</button>
			)}

			{showResult && (
				<div className={`overflow-hidden rounded-xl p-5 ${isCorrect ? "bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30" : "bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30"}`}>
					<div className="mb-4 flex items-start gap-3">
						<div
							className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${isCorrect ? "bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-800/40 text-red-700 dark:text-red-400"}`}
						>
							{isCorrect ? "📝" : "🔤"}
						</div>
						<div>
							<p className={`text-lg font-bold font-tusker ${isCorrect ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
								{isCorrect ? "Well filled!" : "Almost there"}
							</p>
							<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
								Use the explanation to understand the missing words, then
								continue.
							</p>
						</div>
					</div>
					{onViewExplanation && (
						<button
							type="button"
							onClick={onViewExplanation}
							className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-dark-surface px-4 py-3.5 text-sm font-semibold text-gray-800 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border font-montserrat"
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
						className="mt-3 w-full rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat"
					>
						Next Question →
					</button>
				</div>
			)}
		</div>
	);
}

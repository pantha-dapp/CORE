import { type ReactNode, useMemo, useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	wrongOptions?: string[];
	words: string[];
	answers: string[];
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
}

export function FillInTheBlanks({
	imageUrl,
	onSubmit,
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
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		setShowResult(true);

		try {
			await onSubmit(userInputs);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting fill in the blanks:", error);
			setShowResult(false);
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
				<h3 className="text-2xl font-bold">Fill in the Blanks</h3>
				<div className="bg-yellow-500/10 border border-yellow-500/30 p-5 rounded-lg text-center space-y-3">
					<p className="text-yellow-300 text-sm font-medium">
						⚠️ This question couldn't be displayed properly.
					</p>
					<p className="text-gray-400 text-sm">
						Tap Continue to move on — it won't affect your progress.
					</p>
				</div>
				<Button onClick={() => onSubmit([])} className="w-full">
					Continue
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h3 className="text-2xl font-bold">Fill in the Blanks</h3>

			{imageUrl && (
				<img src={imageUrl} alt="Question" className="rounded-lg w-full" />
			)}

			{/* Sentence with blanks */}
			<div className="bg-gray-900/50 p-6 rounded-lg text-lg leading-loose">
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
									className="text-gray-200"
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
								className={`inline-flex items-center justify-center mx-1 px-3 py-1 min-w-28 border-b-2 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus:outline-none transition-colors font-semibold ${
									isCorrect
										? "border-green-500 text-green-300"
										: isFilled
											? "border-blue-400 text-blue-300 hover:border-red-400 hover:text-red-300"
											: "border-gray-500 text-gray-500"
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
							<span key={`w-${wordIdx}-tail-${occ}`} className="text-gray-200">
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
				<div className="bg-gray-800/50 p-5 rounded-lg">
					<h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
						💡 Word Bank
					</h4>
					<div className="flex flex-wrap gap-2">
						{remainingOptions.map(({ id, v }) => (
							<button
								key={`hint-${id}`}
								type="button"
								onClick={() => selectOption(v)}
								disabled={showResult || isSubmitting}
								className="px-3 py-1 rounded-full text-sm bg-gray-700 border border-gray-500 text-gray-300 hover:bg-gray-600 hover:border-blue-400 hover:text-white transition-colors"
							>
								{v}
							</button>
						))}
					</div>
				</div>
			)}

			{!showResult && (
				<Button
					onClick={handleSubmit}
					className="w-full"
					disabled={!allFilled || isSubmitting}
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</Button>
			)}

			{showResult && (
				<div className="bg-blue-500/10 p-4 rounded-lg">
					<p className="text-blue-400 font-semibold mb-1">Answer submitted!</p>
					<p className="text-sm text-blue-400 mt-1">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

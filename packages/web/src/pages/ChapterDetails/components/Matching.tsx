import { useMemo, useState } from "react";

interface Props {
	pairs: Array<{ left: string; right: string }>;
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
	onViewExplanation?: () => void;
	isExplanationLoading?: boolean;
}

export function Matching({
	pairs,
	imageUrl,
	onSubmit,
	answerResult,
	onContinue,
	onViewExplanation,
	isExplanationLoading,
}: Props) {
	const [matches, setMatches] = useState<Record<number, number>>({});
	const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const showResult = answerResult !== null;
	const isCorrect = answerResult?.correct ?? false;

	const shuffledRights = useMemo(() => {
		const original = pairs.map((pair, i) => ({
			right: pair.right,
			originalIdx: i,
		}));
		console.log(
			"Before shuffle:",
			original.map((o) => o.right),
		);
		const shuffled = [...original].sort(() => Math.random() - 0.5);
		console.log(
			"After shuffle:",
			shuffled.map((o) => o.right),
		);
		return shuffled;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const allMatched = Object.keys(matches).length === pairs.length;

	function handleLeftClick(index: number) {
		if (showResult || matches[index] !== undefined) return;
		setSelectedLeft(index);
	}

	function handleRightClick(index: number) {
		if (showResult || selectedLeft === null) return;

		const isAlreadyMatched = Object.values(matches).includes(index);
		if (isAlreadyMatched) return;

		setMatches((prev) => ({
			...prev,
			[selectedLeft]: index,
		}));
		setSelectedLeft(null);
	}

	function clearMatch(leftIndex: number) {
		const newMatches = { ...matches };
		delete newMatches[leftIndex];
		setMatches(newMatches);
	}

	async function handleSubmit() {
		setIsSubmitting(true);

		try {
			const answeredPairs = pairs.map((pair, idx) => {
				const rightIndex = matches[idx];
				return {
					left: pair.left,
					right:
						rightIndex !== undefined ? (pairs[rightIndex]?.right ?? "") : "",
				};
			});

			await onSubmit([JSON.stringify(answeredPairs)]);
		} catch (error) {
			console.error("Error submitting matching:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="space-y-4">
			<h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker">Match the Pairs</h3>
			{imageUrl && (
				<img src={imageUrl} alt="Matching" className="rounded-lg w-full" />
			)}
			<p className="text-gray-800 dark:text-dark-text font-montserrat">
				Click a term on the left, then click its match on the right.
			</p>

			<div className="grid grid-cols-2 gap-4">
				{/* Left column */}
				<div className="space-y-2">
					{pairs.map((pair, idx) => {
						const isMatched = matches[idx] !== undefined;
						const isSelected = selectedLeft === idx;

						return (
							<button
								key={`left-${idx}-${pair.left}`}
								type="button"
								onClick={() => handleLeftClick(idx)}
								disabled={showResult || isMatched}
								className={`w-full text-left p-4 rounded-xl border-2 transition-all font-montserrat ${
									isSelected
										? "border-gray-800 dark:border-dark-accent bg-gray-100 dark:bg-dark-surface"
										: "border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border bg-white dark:bg-dark-surface"
								} ${isMatched ? "opacity-50 cursor-not-allowed" : ""}`}
							>
								<div className="flex items-center justify-between gap-2">
									<span className="text-gray-800 dark:text-dark-text">{pair.left}</span>
									{isMatched && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												!showResult && clearMatch(idx);
											}}
											className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
										>
											✗
										</button>
									)}
								</div>
							</button>
						);
					})}
				</div>

				{/* Right column */}
				<div className="space-y-2">
					{shuffledRights.map((item) => {
						const isMatched = Object.values(matches).includes(item.originalIdx);

						return (
							<button
								key={`right-${item.originalIdx}-${item.right}`}
								type="button"
								onClick={() => handleRightClick(item.originalIdx)}
								disabled={showResult || isMatched}
								className={`w-full text-left p-4 rounded-xl border-2 transition-all font-montserrat ${
									isMatched
										? "opacity-50 cursor-not-allowed border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface"
										: "border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border bg-white dark:bg-dark-surface"
								} ${selectedLeft !== null && !isMatched ? "hover:border-gray-400 dark:hover:border-dark-accent" : ""}`}
							>
								<span className="text-gray-800 dark:text-dark-text">{item.right}</span>
							</button>
						);
					})}
				</div>
			</div>

			<div className="text-sm text-gray-600 dark:text-dark-muted font-montserrat">
				Matches: {Object.keys(matches).length} / {pairs.length}
			</div>

			{!showResult && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={!allMatched || isSubmitting}
					className="w-full mt-6 rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 disabled:opacity-50 font-montserrat"
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
							{isCorrect ? "🎯" : "🔁"}
						</div>
						<div>
							<p className={`text-lg font-bold font-tusker ${isCorrect ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
								{isCorrect ? "Pairs matched!" : "Almost there"}
							</p>
							<p className="mt-1 text-sm leading-6 text-gray-600 dark:text-dark-muted font-montserrat">
								Check the explanation, then go to the next question.
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

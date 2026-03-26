import { useMemo, useState } from "react";
import { MathText } from "../../../shared/components/MathText";
import { useHapticFeedback } from "../../../shared/utils/haptics";

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
	const hapticFeedback = useHapticFeedback();
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
		if (showResult) return;
		hapticFeedback.tap();
		if (matches[index] !== undefined) {
			clearMatch(index);
			setSelectedLeft(null);
			return;
		}
		setSelectedLeft(index);
	}

	function handleRightClick(index: number) {
		if (showResult || selectedLeft === null) return;

		const isAlreadyMatched = Object.values(matches).includes(index);
		if (isAlreadyMatched) return;

		hapticFeedback.tap();
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
		<>
			<div className="space-y-4 pb-32">
				<h3 className="text-xl font-bold text-dark-text font-titillium">
					Match the Pairs
				</h3>
				{imageUrl && (
					<img
						src={imageUrl}
						alt="Matching"
						className="rounded-xl w-full border border-dark-border/50"
					/>
				)}
				<p className="text-dark-text text-sm font-titillium">
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
									disabled={showResult}
									className={`w-full text-left p-3 rounded-lg border transition-all font-titillium text-sm ${
										isSelected
											? "border-2 border-dark-accent bg-dark-surface"
											: isMatched
												? "border-dark-success/50 bg-dark-success/10 hover:border-red-400/60 hover:bg-red-900/10"
												: "border-dark-border hover:border-dark-muted bg-dark-card"
									}`}
								>
									<div className="flex items-center justify-between gap-2">
										<MathText className="text-dark-text text-sm">
											{pair.left}
										</MathText>
										{isMatched && (
											<span className="text-dark-muted text-xs shrink-0">
												✕
											</span>
										)}
									</div>
								</button>
							);
						})}
					</div>

					{/* Right column */}
					<div className="space-y-2">
						{shuffledRights.map((item) => {
							const isMatched = Object.values(matches).includes(
								item.originalIdx,
							);

							return (
								<button
									key={`right-${item.originalIdx}-${item.right}`}
									type="button"
									onClick={() => handleRightClick(item.originalIdx)}
									disabled={showResult || isMatched}
									className={`w-full text-left p-3 rounded-lg border transition-all font-titillium text-sm ${
										isMatched
											? "opacity-50 cursor-not-allowed border-dark-border bg-dark-surface"
											: "border-dark-border hover:border-dark-muted bg-dark-card"
									} ${selectedLeft !== null && !isMatched ? "hover:border-dark-accent" : ""}`}
								>
									<MathText className="text-dark-text text-sm">
										{item.right}
									</MathText>
								</button>
							);
						})}
					</div>
				</div>

				<div className="text-xs text-dark-muted font-titillium">
					Matches: {Object.keys(matches).length} / {pairs.length}
				</div>

				{showResult && (
					<div
						className={`overflow-hidden rounded-xl p-4 animate-chapter-result-in ${isCorrect ? "bg-dark-success/10 border border-dark-success/30" : "bg-red-900/20 border border-red-500/30"}`}
					>
						<div className="flex items-start gap-3">
							<div
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${isCorrect ? "bg-dark-success/20 text-dark-success" : "bg-red-800/40 text-red-400"}`}
							>
								{isCorrect ? "🎯" : "🔁"}
							</div>
							<div>
								<p
									className={`font-bold font-titillium text-base ${isCorrect ? "text-dark-success" : "text-red-400"}`}
								>
									{isCorrect ? "Pairs matched!" : "Almost there"}
								</p>
								<p className="mt-0.5 text-sm text-dark-muted font-titillium">
									Check the explanation, then go to the next question.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{!showResult && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={!allMatched || isSubmitting}
					className={`fixed bottom-24 left-4 right-4 z-40 rounded-lg px-4 py-2.5 text-sm font-semibold font-titillium transition-all ${
						!allMatched
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
							className="w-full flex items-center justify-center gap-2 rounded-lg bg-dark-surface px-3 py-2 text-sm font-semibold text-dark-text hover:bg-dark-border font-titillium"
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

import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";

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
			<h3 className="text-2xl font-bold">Match the Pairs</h3>
			{imageUrl && (
				<img src={imageUrl} alt="Matching" className="rounded-lg w-full" />
			)}
			<p className="text-gray-300">
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
								className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
									isSelected
										? "border-blue-500 bg-blue-500/10"
										: "border-gray-600 hover:border-gray-500"
								} ${isMatched ? "opacity-50 cursor-not-allowed" : ""}`}
							>
								<div className="flex items-center justify-between gap-2">
									<span>{pair.left}</span>
									{isMatched && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												!showResult && clearMatch(idx);
											}}
											className="text-xs text-red-400 hover:text-red-300"
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
								className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
									isMatched
										? "opacity-50 cursor-not-allowed border-gray-600"
										: "border-gray-600 hover:border-gray-500"
								} ${selectedLeft !== null && !isMatched ? "hover:border-blue-400" : ""}`}
							>
								{item.right}
							</button>
						);
					})}
				</div>
			</div>

			<div className="text-sm text-gray-400">
				Matches: {Object.keys(matches).length} / {pairs.length}
			</div>

			{!showResult && (
				<Button
					onClick={handleSubmit}
					className="w-full mt-6"
					disabled={!allMatched || isSubmitting}
				>
					{isSubmitting ? "Checking..." : "Submit Answer"}
				</Button>
			)}

			{showResult && (
				<div
					className={`overflow-hidden rounded-[1.75rem] border-2 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] ${
						isCorrect
							? "border-emerald-400/35 bg-linear-to-br from-emerald-500/18 to-emerald-400/8"
							: "border-rose-400/35 bg-linear-to-br from-rose-500/18 to-rose-400/8"
					}`}
				>
					<div className="mb-4 flex items-start gap-3">
						<div
							className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl ${isCorrect ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100" : "border-rose-300/30 bg-rose-300/15 text-rose-100"}`}
						>
							{isCorrect ? "🎯" : "🔁"}
						</div>
						<div>
							<p
								className={`text-lg font-black ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}
							>
								{isCorrect ? "Pairs matched!" : "Almost there"}
							</p>
							<p className="mt-1 text-sm leading-6 text-slate-200">
								Check the explanation, then go to the next question.
							</p>
						</div>
					</div>
					{onViewExplanation && (
						<button
							type="button"
							onClick={onViewExplanation}
							className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3.5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/16"
						>
							<span>💡</span>
							<span>
								{isExplanationLoading
									? "Loading explanation…"
									: "View Explanation"}
							</span>
						</button>
					)}
					<Button
						onClick={onContinue}
						className="mt-3 w-full"
						icon="arrow-right"
						iconPosition="right"
					>
						Next Question
					</Button>
				</div>
			)}
		</div>
	);
}

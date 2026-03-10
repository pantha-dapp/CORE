import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	pairs: Array<{ left: string; right: string }>;
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
}

export function Matching({ pairs, imageUrl, onSubmit }: Props) {
	const [matches, setMatches] = useState<Record<number, number>>({});
	const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const shuffledRights = useMemo(
		() =>
			[...pairs.map((pair, i) => ({ right: pair.right, originalIdx: i }))].sort(
				() => Math.random() - 0.5,
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

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
		setShowResult(true);

		try {
			const answer = pairs.flatMap((pair, idx) => {
				const rightIndex = matches[idx];
				return [
					pair.left,
					rightIndex !== undefined ? (pairs[rightIndex]?.right ?? "") : "",
				];
			});

			await onSubmit(answer);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (error) {
			console.error("Error submitting matching:", error);
			setShowResult(false);
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
				<div className="bg-blue-500/10 p-4 rounded-lg">
					<p className="text-blue-400 font-bold">✓ Answer submitted!</p>
					<p className="text-sm text-blue-400 mt-2">Moving to next page...</p>
				</div>
			)}
		</div>
	);
}

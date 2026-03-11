import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";

interface Props {
	pairs: Array<{ left: string; right: string }>;
	imageUrl?: string;
	onSubmit: (answer: string[]) => Promise<void>;
	answerResult: { correct: boolean; pageIndex: number } | null;
	onContinue: () => void;
}

export function Matching({
	pairs,
	imageUrl,
	onSubmit,
	answerResult,
	onContinue,
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
			const answer = pairs.flatMap((pair, idx) => {
				const rightIndex = matches[idx];
				return [
					pair.left,
					rightIndex !== undefined ? (pairs[rightIndex]?.right ?? "") : "",
				];
			});

			await onSubmit(answer);
			console.log("Submitted answer:", answer);
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
					className={`p-4 rounded-2xl border ${
						isCorrect
							? "border-green-500/40 bg-green-500/10"
							: "border-red-500/40 bg-red-500/10"
					}`}
				>
					<p
						className={`font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}
					>
						{isCorrect ? "✓ Correct!" : "✗ Incorrect"}
					</p>
					<p className="text-sm text-gray-300 mt-2">
						Your answer has been checked by the server.
					</p>
					<Button onClick={onContinue} className="w-full mt-4">
						Continue
					</Button>
				</div>
			)}
		</div>
	);
}

import Button from "../../../shared/components/Button";

interface Props {
	correctCount: number;
	incorrectCount: number;
	totalPages: number;
	onBackClick: () => void;
}

export function CompletionScreen({
	correctCount,
	incorrectCount,
	totalPages,
	onBackClick,
}: Props) {
	const percentage = Math.round((correctCount / totalPages) * 100);

	return (
		<div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl p-8 text-center">
			<div className="text-6xl mb-4">🎉</div>
			<h2 className="text-4xl font-bold mb-2">Chapter Complete!</h2>
			<p className="text-gray-300 mb-8 text-lg">
				Great job! You've finished all pages in this chapter.
			</p>

			{/* Score Breakdown */}
			<div className="grid grid-cols-3 gap-4 mb-8">
				<div className="bg-green-900/20 border-2 border-green-500 rounded-xl p-6">
					<p className="text-green-400 text-sm font-semibold mb-2">Correct</p>
					<p className="text-5xl font-bold text-green-400">{correctCount}</p>
				</div>

				<div className="bg-red-900/20 border-2 border-red-500 rounded-xl p-6">
					<p className="text-red-400 text-sm font-semibold mb-2">Incorrect</p>
					<p className="text-5xl font-bold text-red-400">{incorrectCount}</p>
				</div>

				<div className="bg-blue-900/20 border-2 border-blue-500 rounded-xl p-6">
					<p className="text-blue-400 text-sm font-semibold mb-2">Total</p>
					<p className="text-5xl font-bold text-blue-400">{totalPages}</p>
				</div>
			</div>

			{/* Progress Percentage */}
			<div className="mb-8">
				<p className="text-gray-300 mb-3 font-semibold">Your Score</p>
				<div className="w-full bg-gray-700 rounded-full h-4 mb-4">
					<div
						className="bg-linear-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-1000"
						style={{ width: `${percentage}%` }}
					/>
				</div>
				<p className="text-4xl font-bold text-white">{percentage}%</p>
			</div>

			<Button onClick={onBackClick} className="mt-6 px-8">
				← Back to Chapters
			</Button>
		</div>
	);
}

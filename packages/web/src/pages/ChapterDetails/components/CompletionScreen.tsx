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
		<div className="rounded-xl p-4 text-center">
			<div className="text-6xl mb-4">🎉</div>
			<h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text font-tusker mb-2">
				Chapter Complete!
			</h2>
			<p className="text-gray-600 dark:text-dark-muted mb-8 text-lg font-montserrat">
				Great job! You've finished all pages in this chapter.
			</p>

			{/* Score Breakdown */}
			<div className="grid grid-cols-3 gap-4 mb-8">
				<div className="rounded-xl bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30 p-2">
					<p className="text-green-700 dark:text-green-400 text-sm font-semibold mb-2 font-montserrat">
						Correct
					</p>
					<p className="text-4xl font-bold text-green-600 dark:text-green-400 tabular-nums">
						{correctCount}
					</p>
				</div>

				<div className="rounded-xl bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30 p-2">
					<p className="text-red-700 dark:text-red-400 text-sm font-semibold mb-2 font-montserrat">
						Incorrect
					</p>
					<p className="text-4xl font-bold text-red-600 dark:text-red-400 tabular-nums">
						{incorrectCount}
					</p>
				</div>

				<div className="rounded-xl bg-gray-100 dark:bg-dark-surface p-2">
					<p className="text-gray-700 dark:text-dark-muted text-sm font-semibold mb-2 font-montserrat">
						Total
					</p>
					<p className="text-4xl font-bold text-gray-800 dark:text-dark-text tabular-nums">
						{totalPages}
					</p>
				</div>
			</div>

			{/* Progress Percentage */}
			<div className="mb-8">
				<p className="text-gray-600 dark:text-dark-muted mb-3 font-semibold font-montserrat">
					Your Score
				</p>
				<div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-4 mb-4 overflow-hidden">
					<div
						className="h-4 rounded-full bg-landing-button-primary dark:bg-dark-accent transition-all duration-1000"
						style={{ width: `${percentage}%` }}
					/>
				</div>
				<p className="text-3xl font-bold text-gray-900 dark:text-dark-text tabular-nums">
					{percentage}%
				</p>
			</div>

			<button
				type="button"
				onClick={onBackClick}
				className="rounded-xl bg-landing-button-primary dark:bg-dark-accent px-8 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat"
			>
				← Back to Chapters
			</button>
		</div>
	);
}

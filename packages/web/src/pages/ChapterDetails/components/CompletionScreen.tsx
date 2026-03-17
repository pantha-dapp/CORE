import { useEffect, useState } from "react";

interface Props {
	correctCount: number;
	incorrectCount: number;
	totalPages: number;
	xpEarned: number;
	onBackClick: () => void;
}

// Counter component that animates from 0 to target value
function AnimatedCounter({
	target,
	duration = 1200,
}: {
	target: number;
	duration?: number;
}) {
	const [count, setCount] = useState(0);

	useEffect(() => {
		let startTime: number;
		let animationFrameId: number;

		// Easing function for smooth acceleration/deceleration
		const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

		const animate = (currentTime: number) => {
			if (!startTime) startTime = currentTime;
			const progress = Math.min((currentTime - startTime) / duration, 1);
			const easeProgress = easeOutCubic(progress);
			const currentCount = Math.round(easeProgress * target);

			setCount(currentCount);

			if (progress < 1) {
				animationFrameId = requestAnimationFrame(animate);
			}
		};

		animationFrameId = requestAnimationFrame(animate);

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [target, duration]);

	return <>{count}</>;
}

export function CompletionScreen({
	correctCount,
	incorrectCount,
	totalPages,
	xpEarned,
	onBackClick,
}: Props) {
	const percentage = Math.round((correctCount / totalPages) * 100);

	// Trigger entrance animation on mount
	useEffect(() => {
		// Animation is handled by Tailwind's animate-in classes
	}, []);

	return (
		<div className="rounded-xl p-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
			<div className="text-6xl mb-4">🎉</div>
			<h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text font-tusker mb-2">
				Chapter Complete!
			</h2>
			<p className="text-gray-600 dark:text-dark-muted mb-8 text-lg font-montserrat">
				Great job! You've finished all pages in this chapter.
			</p>

			{/* Score Breakdown */}
			<div className="grid grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
				<div className="rounded-xl bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-500/30 p-2">
					<p className="text-green-700 dark:text-green-400 text-sm font-semibold mb-2 font-montserrat">
						Correct
					</p>
					<p className="text-4xl font-bold text-green-600 dark:text-green-400 tabular-nums">
						<AnimatedCounter target={correctCount} duration={1200} />
					</p>
				</div>

				<div className="rounded-xl bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/30 p-2">
					<p className="text-red-700 dark:text-red-400 text-sm font-semibold mb-2 font-montserrat">
						Incorrect
					</p>
					<p className="text-4xl font-bold text-red-600 dark:text-red-400 tabular-nums">
						<AnimatedCounter target={incorrectCount} duration={1200} />
					</p>
				</div>

				<div className="rounded-xl bg-gray-100 dark:bg-dark-surface p-2">
					<p className="text-gray-700 dark:text-dark-muted text-sm font-semibold mb-2 font-montserrat">
						Total
					</p>
					<p className="text-4xl font-bold text-gray-800 dark:text-dark-text tabular-nums">
						<AnimatedCounter target={totalPages} duration={1200} />
					</p>
				</div>

				<div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 dark:border dark:border-yellow-500/30 p-2 col-span-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
					<p className="text-yellow-700 dark:text-yellow-400 text-sm font-semibold mb-2 font-montserrat">
						XP Earned
					</p>
					<p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
						<AnimatedCounter target={xpEarned} duration={1500} />
					</p>
				</div>
			</div>

			{/* Progress Percentage */}
			<div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
				<p className="text-gray-600 dark:text-dark-muted mb-3 font-semibold font-montserrat">
					Your Score
				</p>
				<div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-4 mb-4 overflow-hidden">
					<div
						className="h-4 rounded-full bg-landing-button-primary dark:bg-dark-accent transition-all duration-1500 ease-out"
						style={{ width: `${percentage}%` }}
					/>
				</div>
				<p className="text-3xl font-bold text-gray-900 dark:text-dark-text tabular-nums">
					<AnimatedCounter target={percentage} duration={1500} />%
				</p>
			</div>

			<button
				type="button"
				onClick={onBackClick}
				className="rounded-xl bg-landing-button-primary dark:bg-dark-accent px-8 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 hover:opacity-90 font-montserrat animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500"
			>
				← Back to Chapters
			</button>
		</div>
	);
}

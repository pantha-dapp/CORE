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
		<div className="rounded-2xl p-5 text-center">
			<div className="text-5xl mb-3">🎉</div>
			<h2 className="text-2xl font-bold text-dark-text font-titillium mb-2">
				Chapter Complete!
			</h2>
			<p className="text-dark-muted mb-6 font-titillium">
				Great job! You've finished all pages in this chapter.
			</p>

			{/* Score Breakdown */}
			<div className="grid grid-cols-3 gap-3 mb-6">
				<div
					className="rounded-xl bg-dark-success/10 border border-dark-success/30 p-3 animate-chapter-result-in"
					style={{ animationDelay: "0.1s" }}
				>
					<p className="text-dark-success text-xs font-semibold mb-1 font-titillium">
						Correct
					</p>
					<p className="text-2xl font-bold text-dark-success tabular-nums">
						<AnimatedCounter target={correctCount} duration={1200} />
					</p>
				</div>

				<div
					className="rounded-xl bg-red-900/20 border border-red-500/30 p-3 animate-chapter-result-in"
					style={{ animationDelay: "0.15s" }}
				>
					<p className="text-red-400 text-xs font-semibold mb-1 font-titillium">
						Incorrect
					</p>
					<p className="text-2xl font-bold text-red-400 tabular-nums">
						<AnimatedCounter target={incorrectCount} duration={1200} />
					</p>
				</div>

				<div
					className="rounded-xl bg-dark-surface border border-dark-border/50 p-3 animate-chapter-result-in"
					style={{ animationDelay: "0.2s" }}
				>
					<p className="text-dark-muted text-xs font-semibold mb-1 font-titillium">
						Total
					</p>
					<p className="text-2xl font-bold text-dark-text tabular-nums">
						<AnimatedCounter target={totalPages} duration={1200} />
					</p>
				</div>

				<div
					className="rounded-xl bg-dark-accent/20 border border-dark-accent/40 p-3 col-span-3 animate-chapter-result-in"
					style={{ animationDelay: "0.25s" }}
				>
					<p className="text-dark-accent text-xs font-semibold mb-1 font-titillium">
						XP Earned
					</p>
					<p className="text-2xl font-bold text-dark-accent tabular-nums">
						<AnimatedCounter target={xpEarned} duration={1500} />
					</p>
				</div>
			</div>

			{/* Progress Percentage */}
			<div
				className="mb-6 animate-chapter-result-in"
				style={{ animationDelay: "0.3s" }}
			>
				<p className="text-dark-muted mb-2 text-sm font-semibold font-titillium">
					Your Score
				</p>
				<div className="w-full bg-dark-surface rounded-full h-2 mb-3 overflow-hidden">
					<div
						className="h-2 rounded-full bg-dark-accent transition-all duration-1500 ease-out"
						style={{ width: `${percentage}%` }}
					/>
				</div>
				<p className="text-2xl font-bold text-dark-text tabular-nums">
					<AnimatedCounter target={percentage} duration={1500} />%
				</p>
			</div>

			<button
				type="button"
				onClick={onBackClick}
				className="rounded-lg bg-dark-accent px-4 py-2.5 text-sm font-semibold text-dark-bg hover:opacity-90 font-titillium animate-chapter-result-in"
				style={{ animationDelay: "0.35s" }}
			>
				← Back to Chapters
			</button>
		</div>
	);
}

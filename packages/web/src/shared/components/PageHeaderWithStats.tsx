import { usePanthaContext } from "@pantha/react";
import { useUserInfo } from "@pantha/react/hooks";

interface PageHeaderWithStatsProps {
	badge?: string;
	title: string;
	subtitle?: string;
	className?: string;
}

export default function PageHeaderWithStats({
	badge,
	title,
	subtitle,
	className = "",
}: PageHeaderWithStatsProps) {
	const { wallet } = usePanthaContext();
	const { data: userInfo } = useUserInfo({
		walletAddress: wallet?.account.address,
	});

	const streak = userInfo?.user?.streak?.currentStreak ?? 0;

	return (
		<div className={`mb-8 ${className}`}>
			{/* Badge + Stats in same line */}
			<div className="flex items-center justify-between mb-6">
				{badge && (
					<div className="inline-block">
						<span className="px-4 py-2 rounded-full bg-linear-to-r from-dark-accent/40 to-dark-accent/20 border border-dark-accent/40 text-dark-accent text-sm font-semibold uppercase tracking-wider font-montserrat">
							{badge}
						</span>
					</div>
				)}
				<div className="flex items-center gap-1">
					<div className="flex items-center gap-1 rounded-full px-2 py-1 bg-dark-surface">
						<span className="text-sm">🔥</span>
						<span className="text-xs font-semibold text-dark-accent tabular-nums">
							{streak}
						</span>
					</div>
					<div className="flex items-center gap-1 rounded-full px-2 py-1 bg-dark-surface">
						<span className="text-sm">💎</span>
						<span className="text-xs font-semibold text-dark-accent tabular-nums">
							{userInfo?.user.xpCount ?? 0}
						</span>
					</div>
					<div className="flex items-center gap-1 rounded-full px-2 py-1 bg-dark-surface">
						<span className="text-sm">⚡</span>
						<span className="text-xs font-semibold text-dark-accent tabular-nums">
							{userInfo?.user.xp ?? 0}
						</span>
					</div>
				</div>
			</div>

			{/* Title and subtitle */}
			<div>
				<h1 className="text-4xl sm:text-5xl font-bold text-dark-text mb-3 font-titillium leading-tight">
					{title}
				</h1>
				{subtitle && (
					<p className="text-lg text-dark-muted font-montserrat max-w-2xl">
						{subtitle}
					</p>
				)}
			</div>
		</div>
	);
}

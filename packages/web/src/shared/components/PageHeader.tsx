interface PageHeaderProps {
	badge?: string;
	title: string;
	subtitle?: string;
	className?: string;
}

export default function PageHeader({
	badge,
	title,
	subtitle,
	className = "",
}: PageHeaderProps) {
	return (
		<div className={`mb-8 ${className}`}>
			{badge && (
				<div className="inline-block mb-4">
					<span className="px-4 py-2 rounded-full bg-linear-to-r from-dark-accent/40 to-dark-accent/20 border border-dark-accent/40 text-dark-accent text-sm font-semibold uppercase tracking-wider font-montserrat">
						{badge}
					</span>
				</div>
			)}
			<h1 className="text-4xl sm:text-5xl font-bold text-dark-text mb-3 font-titillium leading-tight">
				{title}
			</h1>
			{subtitle && (
				<p className="text-lg text-dark-muted font-montserrat max-w-2xl">
					{subtitle}
				</p>
			)}
		</div>
	);
}

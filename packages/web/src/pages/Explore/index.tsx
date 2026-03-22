import PageHeader from "../../shared/components/PageHeader";

export default function Explore() {
	return (
		<div className="dark pt-6 min-h-screen bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg text-dark-text px-4 pb-24">
			<div className="max-w-6xl mx-auto">
				<PageHeader
					badge="Discovery"
					title="Explore"
					subtitle="Discover new courses, events, and shop items here!"
				/>

				{/* Coming Soon */}
				<div className="text-center py-16">
					<p className="text-dark-muted text-lg font-montserrat">
						More features coming soon...
					</p>
				</div>
			</div>
		</div>
	);
}

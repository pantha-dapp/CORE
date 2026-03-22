import { usePanthaContext } from "@pantha/react";
import { useUserInfo } from "@pantha/react/hooks";
import { useState } from "react";
import PageHeaderWithStats from "../../shared/components/PageHeaderWithStats";
import ClaimModal from "./ClaimModal";

export default function Wallet() {
	const { wallet } = usePanthaContext();
	const walletAddress = wallet?.account.address;
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Fetch user info (includes XP data)
	const { data: userInfo, isLoading: userInfoLoading } = useUserInfo({
		walletAddress,
	});

	// Get XP balance
	const xpBalance = userInfo?.user?.xpCount ?? 0;

	return (
		<div className="dark min-h-screen bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg">
			<div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
				<PageHeaderWithStats
					badge="Assets"
					title="Wallet"
					subtitle="Track your rewards and tokens"
				/>

				{/* Main Balance Card */}
				<div className="mb-8 rounded-2xl bg-linear-to-br from-dark-accent to-dark-accent/80 p-8 text-white shadow-lg">
					<p className="text-sm font-semibold uppercase tracking-wider opacity-90 font-montserrat">
						Your XP
					</p>
					<h2 className="mt-3 text-5xl font-bold font-titillium">
						{userInfoLoading ? "Loading..." : xpBalance}
					</h2>
					<p className="mt-2 text-sm opacity-75 font-montserrat">
						Earned through learning and activities
					</p>

					{/* Action Button */}
					<button
						type="button"
						onClick={() => setIsModalOpen(true)}
						className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-dark-accent transition-all hover:shadow-lg dark:bg-dark-card dark:text-dark-accent font-montserrat"
					>
						Manage Tokens & Claims
					</button>
				</div>

				{/* Quick Overview */}
				<div className="rounded-2xl bg-dark-card/95 backdrop-blur-xl border-0 shadow-xl p-6 sm:p-8">
					<h3 className="mb-6 text-xl font-bold text-dark-text font-titillium">
						Quick Overview
					</h3>

					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-lg border border-dark-border bg-linear-to-br from-dark-surface to-dark-surface/30 p-4">
							<p className="text-sm text-dark-muted font-montserrat">
								Total XP
							</p>
							<p className="mt-2 text-3xl font-bold text-dark-accent font-titillium">
								{userInfoLoading ? "..." : xpBalance}
							</p>
						</div>

						<div className="rounded-lg border border-dark-border bg-linear-to-br from-dark-surface to-dark-surface/30 p-4">
							<p className="text-sm text-dark-muted font-montserrat">
								Day Streak
							</p>
							<p className="mt-2 text-3xl font-bold text-green-400 font-titillium">
								{userInfo?.user?.streak?.currentStreak ?? 0}
							</p>
						</div>

						<div className="rounded-lg border border-dark-border bg-linear-to-br from-dark-surface to-dark-surface/30 p-4">
							<p className="text-sm text-dark-muted font-montserrat">
								Account Active
							</p>
							<p className="mt-2 text-3xl font-bold text-blue-400 font-titillium">
								{userInfo?.user?.name ? "✓" : "..."}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Claim Modal */}
			<ClaimModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
		</div>
	);
}

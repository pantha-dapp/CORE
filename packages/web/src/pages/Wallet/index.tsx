import { usePanthaContext } from "@pantha/react";
import { useUserInfo } from "@pantha/react/hooks";
import { useState } from "react";
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
		<div className="min-h-screen bg-landing-hero-bg dark:bg-dark-bg">
			<div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text font-tusker">
						Wallet
					</h1>
					<p className="mt-2 text-lg text-gray-600 dark:text-dark-muted font-montserrat">
						Track your rewards and tokens
					</p>
				</div>

				{/* Main Balance Card */}
				<div className="mb-8 rounded-2xl bg-linear-to-br from-landing-button-primary to-blue-600 dark:from-dark-accent dark:to-blue-700 p-8 text-white shadow-lg">
					<p className="text-sm font-semibold uppercase tracking-wider opacity-90 font-montserrat">
						Your XP
					</p>
					<h2 className="mt-3 text-5xl font-bold font-tusker">
						{userInfoLoading ? "Loading..." : xpBalance}
					</h2>
					<p className="mt-2 text-sm opacity-75 font-montserrat">
						Earned through learning and activities
					</p>

					{/* Action Button */}
					<button
						type="button"
						onClick={() => setIsModalOpen(true)}
						className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-landing-button-primary transition-all hover:shadow-lg dark:bg-dark-card dark:text-dark-accent font-montserrat"
					>
						Manage Tokens & Claims
					</button>
				</div>

				{/* Quick Overview */}
				<div className="rounded-xl bg-white dark:bg-dark-card p-6 shadow-sm sm:p-8">
					<h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-dark-text font-tusker">
						Quick Overview
					</h3>

					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-lg border border-gray-200 p-4 dark:border-dark-border">
							<p className="text-sm text-gray-600 dark:text-dark-muted font-montserrat">
								Total XP
							</p>
							<p className="mt-2 text-3xl font-bold text-landing-button-primary dark:text-dark-accent font-tusker">
								{userInfoLoading ? "..." : xpBalance}
							</p>
						</div>

						<div className="rounded-lg border border-gray-200 p-4 dark:border-dark-border">
							<p className="text-sm text-gray-600 dark:text-dark-muted font-montserrat">
								Day Streak
							</p>
							<p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400 font-tusker">
								{userInfo?.user?.streak?.currentStreak ?? 0}
							</p>
						</div>

						<div className="rounded-lg border border-gray-200 p-4 dark:border-dark-border">
							<p className="text-sm text-gray-600 dark:text-dark-muted font-montserrat">
								Account Active
							</p>
							<p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400 font-tusker">
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

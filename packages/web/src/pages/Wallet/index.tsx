import { usePanthaContext } from "@pantha/react";
import { useFaucet, useUserInfo } from "@pantha/react/hooks";
import type { ReactNode } from "react";

interface Transaction {
	id: string;
	type: "earned" | "spent";
	amount: number;
	description: string;
	date: Date;
	icon: ReactNode;
}

export default function Wallet() {
	const { wallet } = usePanthaContext();
	const walletAddress = wallet?.account.address;

	// Fetch user info (includes XP data)
	const { data: userInfo, isLoading: userInfoLoading } = useUserInfo({
		walletAddress,
	});

	// Faucet hook for claiming tokens
	const { mutate: claimTokens, isPending: isClaiming } = useFaucet();

	// Use XP from userInfo or default to 0
	const balance = userInfo?.user?.xpCount ?? 0;
	const transactions: Transaction[] = [
		{
			id: "1",
			type: "earned",
			amount: 150,
			description: "Completed 'Basic Algebra' chapter",
			date: new Date(2026, 2, 16),
			icon: "✨",
		},
		{
			id: "2",
			type: "earned",
			amount: 200,
			description: "Quiz master streak - 5 correct in a row",
			date: new Date(2026, 2, 15),
			icon: "🔥",
		},
		{
			id: "3",
			type: "spent",
			amount: -50,
			description: "Purchased 'Premium hints' power-up",
			date: new Date(2026, 2, 14),
			icon: "💎",
		},
		{
			id: "4",
			type: "earned",
			amount: 300,
			description: "Course completion bonus",
			date: new Date(2026, 2, 10),
			icon: "🏆",
		},
		{
			id: "5",
			type: "earned",
			amount: 100,
			description: "Daily login bonus",
			date: new Date(2026, 2, 9),
			icon: "📅",
		},
	];

	const totalEarned = transactions
		.filter((t) => t.type === "earned")
		.reduce((sum, t) => sum + t.amount, 0);

	const totalSpent = Math.abs(
		transactions
			.filter((t) => t.type === "spent")
			.reduce((sum, t) => sum + t.amount, 0),
	);

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	return (
		<div className="min-h-screen bg-landing-hero-bg dark:bg-dark-bg">
			<div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-dark-text font-tusker">
						Wallet
					</h1>
					<p className="mt-2 text-lg text-gray-600 dark:text-dark-muted font-montserrat">
						Track your XP points and rewards
					</p>
				</div>

				{/* Balance Card */}
				<div className="mb-8 rounded-2xl bg-linear-to-br from-landing-button-primary to-blue-600 dark:from-dark-accent dark:to-blue-700 p-8 text-white shadow-lg">
					<p className="text-sm font-semibold uppercase tracking-wider opacity-90 font-montserrat">
						Current Balance
					</p>
					<h2 className="mt-3 text-5xl font-bold font-tusker">
						{userInfoLoading ? "Loading..." : balance} XP
					</h2>
					<div className="mt-6 flex gap-4">
						<div className="flex-1">
							<p className="text-xs uppercase tracking-wider opacity-75 font-montserrat">
								Total Earned
							</p>
							<p className="mt-1 text-2xl font-bold font-tusker">
								+{totalEarned}
							</p>
						</div>
						<div className="flex-1">
							<p className="text-xs uppercase tracking-wider opacity-75 font-montserrat">
								Total Spent
							</p>
							<p className="mt-1 text-2xl font-bold font-tusker">
								-{totalSpent}
							</p>
						</div>
					</div>
				</div>

				{/* Quick Stats */}
				<div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="rounded-xl bg-white dark:bg-dark-card p-4 shadow-sm">
						<p className="text-2xl font-bold text-landing-button-primary dark:text-dark-accent font-tusker">
							12
						</p>
						<p className="mt-1 text-xs text-gray-600 dark:text-dark-muted font-montserrat">
							Chapters Done
						</p>
					</div>
					<div className="rounded-xl bg-white dark:bg-dark-card p-4 shadow-sm">
						<p className="text-2xl font-bold text-green-600 dark:text-green-400 font-tusker">
							{8}
						</p>
						<p className="mt-1 text-xs text-gray-600 dark:text-dark-muted font-montserrat">
							Day Streak
						</p>
					</div>
					<div className="rounded-xl bg-white dark:bg-dark-card p-4 shadow-sm">
						<p className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-tusker">
							94%
						</p>
						<p className="mt-1 text-xs text-gray-600 dark:text-dark-muted font-montserrat">
							Accuracy
						</p>
					</div>
					<div className="rounded-xl bg-white dark:bg-dark-card p-4 shadow-sm">
						<p className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-tusker">
							3
						</p>
						<p className="mt-1 text-xs text-gray-600 dark:text-dark-muted font-montserrat">
							Badges
						</p>
					</div>
				</div>

				{/* Transaction History */}
				<div className="rounded-xl bg-white dark:bg-dark-card shadow-sm">
					<div className="border-b border-gray-200 dark:border-dark-border px-6 py-4 sm:px-8">
						<h3 className="text-xl font-bold text-gray-900 dark:text-dark-text font-tusker">
							Transaction History
						</h3>
					</div>

					<div className="divide-y divide-gray-200 dark:divide-dark-border">
						{transactions.map((transaction) => (
							<div
								key={transaction.id}
								className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-dark-surface sm:px-8"
							>
								<div className="flex items-center gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-surface text-2xl">
										{transaction.icon}
									</div>
									<div>
										<p className="font-semibold text-gray-900 dark:text-dark-text font-montserrat">
											{transaction.description}
										</p>
										<p className="text-sm text-gray-500 dark:text-dark-muted font-montserrat">
											{formatDate(transaction.date)}
										</p>
									</div>
								</div>
								<p
									className={`text-lg font-bold font-tusker ${
										transaction.type === "earned"
											? "text-green-600 dark:text-green-400"
											: "text-red-600 dark:text-red-400"
									}`}
								>
									{transaction.type === "earned" ? "+" : ""}
									{transaction.amount}
								</p>
							</div>
						))}
					</div>

					{/* View More Button */}
					<div className="border-t border-gray-200 dark:border-dark-border px-6 py-4 text-center sm:px-8">
						<button
							type="button"
							onClick={() => claimTokens()}
							disabled={isClaiming}
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-landing-button-primary dark:bg-dark-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
						>
							{isClaiming ? "Claiming..." : "Claim PANTHA Tokens"}
						</button>
					</div>
				</div>

				{/* Achievements Section */}
				<div className="mt-8 rounded-xl bg-white dark:bg-dark-card shadow-sm">
					<div className="border-b border-gray-200 dark:border-dark-border px-6 py-4 sm:px-8">
						<h3 className="text-xl font-bold text-gray-900 dark:text-dark-text font-tusker">
							Achievements
						</h3>
					</div>

					<div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 sm:p-8">
						<div className="rounded-lg bg-linear-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-4 text-center">
							<p className="text-3xl">🏆</p>
							<p className="mt-2 text-sm font-semibold text-gray-900 dark:text-dark-text font-montserrat">
								Master Learner
							</p>
						</div>
						<div className="rounded-lg bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-4 text-center">
							<p className="text-3xl">🔥</p>
							<p className="mt-2 text-sm font-semibold text-gray-900 dark:text-dark-text font-montserrat">
								On Fire
							</p>
						</div>
						<div className="rounded-lg bg-linear-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-4 text-center">
							<p className="text-3xl">⭐</p>
							<p className="mt-2 text-sm font-semibold text-gray-900 dark:text-dark-text font-montserrat">
								Perfect Score
							</p>
						</div>
					</div>
				</div>

				{/* Footer CTA */}
				<div className="mt-8 rounded-xl bg-linear-to-r from-landing-button-primary/10 to-blue-600/10 dark:from-dark-accent/10 dark:to-blue-700/10 border border-landing-button-primary/20 dark:border-dark-accent/20 p-6 text-center sm:p-8">
					<h3 className="text-lg font-bold text-gray-900 dark:text-dark-text font-tusker">
						Keep Learning!
					</h3>
					<p className="mt-2 text-sm text-gray-600 dark:text-dark-muted font-montserrat">
						You need 300 more XP to reach the next level.
					</p>
					<button
						type="button"
						className="mt-4 rounded-xl bg-landing-button-primary dark:bg-dark-accent px-6 py-3 font-semibold text-landing-button-light-bg dark:text-gray-900 transition-opacity hover:opacity-90 font-montserrat"
					>
						Continue Learning
					</button>
				</div>
			</div>
		</div>
	);
}

import { usePanthaContext } from "@pantha/react";
import {
	usePanthaTokenBalance,
	usePanthaTokenFaucet,
	useUserInfo,
} from "@pantha/react/hooks";
import { useEffect, useState } from "react";

interface ClaimModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function ClaimModal({ isOpen, onClose }: ClaimModalProps) {
	const { wallet } = usePanthaContext();
	const walletAddress = wallet?.account.address;
	const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);

	// Fetch user info (XP data)
	const { data: userInfo, isLoading: userInfoLoading } = useUserInfo({
		walletAddress,
	});

	// Faucet hook for claiming tokens

	const { mutate: claimTokens, isPending: isClaiming } = usePanthaTokenFaucet();

	// Token balance hook
	const { mutateAsync: fetchTokenBalance, isPending: isLoadingBalance } =
		usePanthaTokenBalance();

	// Fetch token balance when modal opens
	useEffect(() => {
		if (isOpen && wallet) {
			fetchTokenBalance().then((balance) => {
				setTokenBalance(balance);
			});
		}
	}, [isOpen, wallet, fetchTokenBalance]);

	if (!isOpen) return null;

	const xpCount = userInfo?.user?.xpCount ?? 0;

	return (
		<>
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 z-40 bg-black/50 transition-opacity"
				onClick={onClose}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div className="fixed left-4 right-4 top-1/2 z-50 max-w-md -translate-y-1/2 transform rounded-2xl bg-white dark:bg-dark-card shadow-xl sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
				{/* Header */}
				<div className="border-b border-gray-200 px-6 py-4 dark:border-dark-border sm:px-8">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text font-tusker">
							Tokens & Claims
						</h2>
						<button
							onClick={onClose}
							type="button"
							className="text-gray-500 transition-colors hover:text-gray-900 dark:text-dark-muted dark:hover:text-dark-text"
							aria-label="Close"
						>
							✕
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="space-y-6 px-6 py-6 sm:px-8">
					{/* XP Balance */}
					<div className="rounded-xl bg-landing-button-primary/10 dark:bg-dark-accent/10 p-4">
						<p className="text-sm font-semibold text-gray-600 dark:text-dark-muted font-montserrat">
							Your XP Balance
						</p>
						<p className="mt-2 text-4xl font-bold text-landing-button-primary dark:text-dark-accent font-tusker">
							{userInfoLoading ? "Loading..." : xpCount}
						</p>
						<p className="mt-1 text-xs text-gray-500 dark:text-dark-muted font-montserrat">
							Earned from learning activities
						</p>
					</div>

					{/* PANTHA Token Balance */}
					<div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
						<p className="text-sm font-semibold text-gray-600 dark:text-dark-muted font-montserrat">
							PANTHA Token Balance
						</p>
						<p className="mt-2 text-4xl font-bold text-blue-600 dark:text-blue-400 font-tusker">
							{isLoadingBalance
								? "Loading..."
								: tokenBalance
									? String(tokenBalance)
									: "0"}
						</p>
						<p className="mt-1 text-xs text-gray-500 dark:text-dark-muted font-montserrat">
							Your tradable token balance
						</p>
					</div>

					{/* User Info */}
					{userInfo?.user && (
						<div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-dark-border">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600 dark:text-dark-muted font-montserrat">
									Wallet Address
								</span>
								<span className="font-mono text-xs font-semibold text-gray-900 dark:text-dark-text">
									{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600 dark:text-dark-muted font-montserrat">
									Day Streak
								</span>
								<span className="text-lg font-bold text-green-600 dark:text-green-400 font-tusker">
									{userInfo.user.streak?.currentStreak ?? 0} 🔥
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600 dark:text-dark-muted font-montserrat">
									Account Status
								</span>
								<span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400 font-montserrat">
									Active ✓
								</span>
							</div>
						</div>
					)}

					{/* Claim Button */}
					<button
						type="button"
						onClick={() => claimTokens()}
						disabled={isClaiming}
						className="w-full rounded-xl bg-landing-button-primary px-6 py-3 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg dark:bg-dark-accent font-montserrat"
					>
						{isClaiming ? "Claiming..." : "Claim 100 PANTHA Tokens"}
					</button>

					<p className="text-center text-xs text-gray-500 dark:text-dark-muted font-montserrat">
						Claim once every 24 hours
					</p>
				</div>
			</div>
		</>
	);
}

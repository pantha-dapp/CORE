import { usePanthaContext } from "@pantha/react";
import { useUserCertificates, useUserInfo } from "@pantha/react/hooks";
import { useState } from "react";
import PageHeaderWithStats from "../../shared/components/PageHeaderWithStats";
import CertificateCard from "./CertificateCard";
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

	// Fetch certificates
	const { data: certsData, isLoading: certsLoading } = useUserCertificates({
		walletAddress,
	});
	const certificates = certsData?.certificates ?? [];

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

			{/* Certificates Section */}
			<div className="mt-8 rounded-2xl bg-dark-card/95 backdrop-blur-xl border border-dark-border shadow-xl p-6 sm:p-8">
				<div className="flex items-center gap-3 mb-6">
					<span className="text-2xl">🎓</span>
					<h3 className="text-xl font-bold text-dark-text font-titillium">
						My Certificates
					</h3>
				</div>

				<div className="mb-4 rounded-xl border border-dark-border bg-dark-surface/40 p-4 text-sm text-dark-muted font-montserrat">
					<p className="font-semibold text-dark-text mb-1">
						How to earn a certificate
					</p>
					<ul className="list-disc list-inside space-y-1">
						<li>
							Complete{" "}
							<span className="text-dark-accent font-semibold">
								more than 10 chapters
							</span>{" "}
							in a course
						</li>
						<li>
							Purchase a{" "}
							<span className="text-dark-accent font-semibold">
								Course Certificate
							</span>{" "}
							from the Shop
						</li>
						<li>
							Request certification from the course page — the more chapters you
							finish, the better the certificate grade
						</li>
					</ul>
				</div>

				{certsLoading ? (
					<div className="flex items-center justify-center py-10">
						<div className="w-6 h-6 border-2 border-dark-accent border-t-transparent rounded-full animate-spin" />
					</div>
				) : certificates.length === 0 ? (
					<div className="text-center py-10 text-dark-muted font-montserrat">
						<p className="text-4xl mb-3">📜</p>
						<p className="text-sm">No certificates yet. Keep learning!</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 pb-12">
						{certificates.map((cert) => (
							<CertificateCard
								key={cert.tokenId}
								tokenId={cert.tokenId}
								txnHash={cert.txnHash}
								dataUri={cert.dataUri}
							/>
						))}
					</div>
				)}
			</div>

			{/* Claim Modal */}
			<ClaimModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
		</div>
	);
}

import { usePanthaContext } from "@pantha/react";
import {
	useFollowUser,
	useSearchUsers,
	useUnfollowUser,
	useUserFollowing,
} from "@pantha/react/hooks";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import Icon from "../../shared/components/Icon";
import PageHeaderWithStats from "../../shared/components/PageHeaderWithStats";

type Tab = "feed" | "chats" | "friends";

function TabButton({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex-1 py-3 rounded-full font-semibold transition font-montserrat ${
				active
					? "bg-dark-surface text-dark-accent"
					: "text-dark-muted hover:text-dark-text"
			}`}
		>
			{label}
		</button>
	);
}

function SectionCard({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`border border-dark-border rounded-xl p-4 bg-linear-to-br from-dark-card/95 to-dark-surface/50 backdrop-blur-xl ${className}`}
		>
			{children}
		</div>
	);
}

function UserSearchBar() {
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [followedWallets, setFollowedWallets] = useState<Set<string>>(
		new Set(),
	);
	const containerRef = useRef<HTMLDivElement>(null);

	const { wallet } = usePanthaContext();
	const { data: searchResults, isLoading } = useSearchUsers({
		query: searchQuery,
	});
	const { data: followingData } = useUserFollowing({
		walletAddress: wallet?.account.address,
	});
	const followUser = useFollowUser();
	const unfollowUser = useUnfollowUser();

	// Build set of wallets the current user follows
	const followingSet = new Set([
		...(followingData?.following ?? []),
		...followedWallets,
	]);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	function handleFollow(walletAddress: Address) {
		setFollowedWallets((prev) => new Set([...prev, walletAddress]));
		followUser.mutate({ walletToFollow: walletAddress });
	}

	function handleUnfollow(walletAddress: Address) {
		setFollowedWallets((prev) => {
			const next = new Set(prev);
			next.delete(walletAddress);
			return next;
		});
		unfollowUser.mutate({ walletToUnfollow: walletAddress });
	}

	const users = searchResults?.users ?? [];
	const showDropdown = isOpen && searchQuery.length > 0;

	return (
		<div ref={containerRef} className="relative mb-6">
			<div className="relative">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
				<input
					type="text"
					placeholder="Search users by username..."
					value={searchQuery}
					onChange={(e) => {
						setSearchQuery(e.target.value);
						setIsOpen(true);
					}}
					onFocus={() => setIsOpen(true)}
					className="w-full pl-12 pr-4 py-3 bg-dark-surface/80 rounded-xl border border-dark-border text-dark-text placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-dark-accent/40 focus:border-dark-accent font-montserrat"
				/>
			</div>

			{showDropdown && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-dark-surface/95 border border-dark-border rounded-xl overflow-hidden z-50">
					{isLoading ? (
						<div className="flex items-center justify-center py-6 text-gray-500 text-sm font-montserrat">
							<Icon name="loader" size={18} className="animate-spin mr-2" />
							Searching...
						</div>
					) : users.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-gray-500">
							<Icon name="user-x" size={32} className="mb-2 opacity-50" />
							<p className="text-sm font-montserrat">
								No users found for "{searchQuery}"
							</p>
						</div>
					) : (
						<div className="max-h-80 overflow-y-auto">
							{users.map(
								(user: {
									walletAddress: string;
									username?: string;
									name?: string;
								}) => {
									const isFollowing = followingSet.has(user.walletAddress);
									const isSelf = wallet?.account.address === user.walletAddress;

									return (
										<div
											key={user.walletAddress}
											className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition"
										>
											<div className="w-10 h-10 rounded-full bg-dark-accent flex items-center justify-center font-bold text-sm shrink-0 text-dark-bg">
												{(user.username ?? "?").charAt(0).toUpperCase()}
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-semibold text-dark-text truncate font-montserrat">
													{user.username}
												</p>
												{user.name && (
													<p className="text-xs text-dark-muted truncate font-montserrat">
														{user.name}
													</p>
												)}
											</div>
											{!isSelf &&
												(isFollowing ? (
													<button
														type="button"
														onClick={() =>
															handleUnfollow(user.walletAddress as Address)
														}
														className="bg-dark-border hover:bg-dark-border/80 text-dark-text px-4 py-2 rounded-xl text-sm font-semibold transition font-montserrat"
													>
														Unfollow
													</button>
												) : (
													<button
														type="button"
														onClick={() =>
															handleFollow(user.walletAddress as Address)
														}
														className="bg-dark-accent hover:bg-dark-accent/90 text-dark-bg px-4 py-2 rounded-xl text-sm font-semibold transition font-montserrat"
													>
														Follow
													</button>
												))}
										</div>
									);
								},
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default function Social() {
	const [activeTab, setActiveTab] = useState<Tab>("feed");
	return (
		<div className="dark min-h-screen pt-6 bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg text-dark-text px-4 pb-24">
			<div className="max-w-4xl mx-auto">
				<PageHeaderWithStats
					badge="Community"
					title="Social"
					subtitle="Connect with friends, share progress, and learn together."
				/>

				{/* User Search */}
				<UserSearchBar />

				{/* Tabs */}
				<div className="rounded-full p-1.5 mb-6 flex gap-2 border border-gray-200 dark:border-dark-border bg-white/10 dark:bg-dark-surface/40">
					<TabButton
						label="Feed"
						active={activeTab === "feed"}
						onClick={() => setActiveTab("feed")}
					/>
					<TabButton
						label="Friends"
						active={activeTab === "friends"}
						onClick={() => setActiveTab("friends")}
					/>
					<TabButton
						label="Chats"
						active={activeTab === "chats"}
						onClick={() => setActiveTab("chats")}
					/>
				</div>

				{/* CONTENT */}
				{activeTab === "feed" && (
					<div className="space-y-6">
						{/* Celebrate Card */}
						<SectionCard className="border-0 bg-transparent p-0">
							<div className="flex items-center gap-4 mb-4">
								<div className="w-14 h-14 bg-dark-accent rounded-full flex items-center justify-center text-3xl border-2 border-dark-accent/30">
									🎉
								</div>
								<div className="flex-1">
									<h3 className="text-xl font-bold text-dark-accent font-titillium">
										Celebrate with friends!
									</h3>
									<p className="text-sm text-dark-muted font-montserrat">
										Share your achievements and inspire others
									</p>
								</div>
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									className="flex-1 bg-dark-accent hover:bg-dark-accent/90 text-dark-bg py-3 rounded-xl font-semibold transition font-montserrat"
								>
									Share Achievement
								</button>
								<button
									type="button"
									className="px-6 bg-dark-border hover:bg-dark-border/80 text-dark-text py-3 rounded-xl font-semibold transition font-montserrat"
								>
									View Friends
								</button>
							</div>
						</SectionCard>

						{/* Daily Tips */}
						<SectionCard className="border-0 bg-transparent p-0">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 bg-dark-accent/20 rounded-full flex items-center justify-center text-2xl shrink-0 border-2 border-dark-accent/30">
									💡
								</div>
								<div className="flex-1">
									<h3 className="text-lg font-bold text-dark-accent font-titillium mb-2">
										Today's Learning Tip
									</h3>
									<p className="text-dark-muted text-sm mb-3 font-montserrat">
										Practice consistently! Studies show that learning in short,
										daily sessions is more effective than cramming. Try to
										complete at least one chapter every day to maintain your
										streak.
									</p>
									<div className="flex items-center gap-2 text-xs text-dark-muted font-montserrat font-semibold">
										<span>📚</span>
										<span>Based on your progress</span>
									</div>
								</div>
							</div>
						</SectionCard>

						{/* Trending Now */}
						<SectionCard className="border-0 bg-transparent p-0">
							<div className="flex items-center gap-3 mb-5">
								<span className="text-2xl">🔥</span>
								<h3 className="text-xl font-bold text-dark-accent font-titillium">
									Trending Now
								</h3>
							</div>
							<div className="space-y-3">
								{[
									{
										rank: 1,
										topic: "Advanced Neural Networks",
										learners: "2.3k learners this week",
										trend: "+45%",
										rowBg: "bg-dark-surface border-dark-accent",
									},
									{
										rank: 2,
										topic: "Blockchain Fundamentals",
										learners: "1.8k learners this week",
										trend: "+38%",
										rowBg: "bg-dark-surface border-dark-border",
									},
									{
										rank: 3,
										topic: "Python for Data Science",
										learners: "1.5k learners this week",
										trend: "+32%",
										rowBg: "bg-dark-surface border-dark-border",
									},
								].map((item) => (
									<div
										key={item.topic}
										className={`flex items-center justify-between p-4 rounded-2xl hover:opacity-90 transition cursor-pointer border-2 ${item.rowBg}`}
									>
										<div className="flex items-center gap-4">
											<div className="text-2xl font-bold text-dark-accent font-titillium">
												#{item.rank}
											</div>
											<div>
												<h4 className="font-semibold text-dark-text font-montserrat">
													{item.topic}
												</h4>
												<p className="text-sm text-dark-muted font-montserrat">
													{item.learners}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-dark-accent text-sm font-semibold font-montserrat">
												{item.trend}
											</span>
										</div>
									</div>
								))}
							</div>
						</SectionCard>

						{/* Who's Learning What */}
						<SectionCard className="border-0 bg-transparent p-0">
							<div className="flex items-center gap-3 mb-5">
								<span className="text-2xl">👥</span>
								<h3 className="text-xl font-bold text-dark-accent font-titillium">
									Who's Learning What
								</h3>
							</div>
							<div className="space-y-3">
								{[
									{
										user: "Sarah Chen",
										avatar: "SC",
										action: "completed",
										course: "Machine Learning Basics",
										achievement: "Earned 50 XP",
										time: "2 min ago",
										avatarBg: "from-dark-accent to-dark-border",
									},
									{
										user: "Alex Kumar",
										avatar: "AK",
										action: "started learning",
										course: "Deep Learning Mastery",
										achievement: "Chapter 1 completed",
										time: "15 min ago",
										avatarBg: "from-landing-hero-bg to-landing-magenta",
									},
									{
										user: "Emma Rodriguez",
										avatar: "ER",
										action: "achieved a milestone in",
										course: "AI Ethics & Safety",
										achievement: "30 day streak! 🔥",
										time: "1 hour ago",
										avatarBg: "from-landing-red to-landing-gold",
									},
								].map((activity) => (
									<div
										key={`${activity.user}-${activity.course}`}
										className="flex items-start gap-4 p-4 bg-dark-surface/50 rounded-2xl hover:bg-dark-surface transition border border-dark-border"
									>
										<div
											className={`w-12 h-12 rounded-full bg-linear-to-br ${activity.avatarBg} flex items-center justify-center font-bold text-sm shrink-0 text-white border-2 border-white/50`}
										>
											{activity.avatar}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm mb-1 font-montserrat">
												<span className="font-semibold text-dark-text">
													{activity.user}
												</span>
												<span className="text-dark-muted">
													{" "}
													{activity.action}{" "}
												</span>
												<span className="font-semibold text-dark-accent">
													{activity.course}
												</span>
											</p>
											<div className="flex items-center gap-3 text-xs font-montserrat">
												<span className="text-dark-accent font-semibold">
													{activity.achievement}
												</span>
												<span className="text-dark-muted">
													• {activity.time}
												</span>
											</div>
										</div>
										<button
											type="button"
											className="text-dark-accent hover:text-dark-accent/80 text-sm font-semibold transition font-montserrat"
										>
											Follow
										</button>
									</div>
								))}
							</div>
						</SectionCard>
					</div>
				)}

				{activeTab === "chats" && (
					<div className="space-y-4">
						{[
							{
								user: "Study Group Alpha",
								avatar: "SG",
								lastMessage: "Who's joining the practice session tomorrow?",
								time: "10m ago",
								unread: 3,
								online: true,
							},
							{
								user: "Sarah Chen",
								avatar: "SC",
								lastMessage: "Thanks for the help with that problem!",
								time: "1h ago",
								unread: 1,
								online: true,
							},
							{
								user: "ML Enthusiasts",
								avatar: "ME",
								lastMessage: "New research paper just dropped!",
								time: "3h ago",
								unread: 0,
								online: false,
							},
							{
								user: "AI Builders Community",
								avatar: "AB",
								lastMessage: "Hackathon registration is now open!",
								time: "Yesterday",
								unread: 5,
								online: true,
							},
						].map((chat, i) => {
							const chatColors = [
								"bg-dark-surface border-dark-border",
								"bg-dark-surface border-dark-border",
								"bg-dark-surface border-dark-border",
								"bg-dark-surface border-dark-border",
							];
							const cardStyle = chatColors[i % chatColors.length];
							return (
								<div
									key={chat.user}
									className={`rounded-2xl p-4 shadow-md hover:shadow-lg transition cursor-pointer border-2 ${cardStyle}`}
								>
									<div className="flex items-center gap-4">
										<div className="relative shrink-0">
											<div className="w-14 h-14 rounded-full bg-dark-surface flex items-center justify-center font-bold text-dark-text border border-dark-border">
												{chat.avatar}
											</div>
											{chat.online && (
												<div className="absolute bottom-0 right-0 w-4 h-4 bg-dark-accent rounded-full border-2 border-dark-surface" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1">
												<h3 className="font-semibold truncate text-dark-text font-montserrat drop-shadow-sm">
													{chat.user}
												</h3>
												<span className="text-xs text-dark-muted shrink-0 font-montserrat">
													{chat.time}
												</span>
											</div>
											<div className="flex items-center justify-between">
												<p className="text-sm text-white/90 truncate font-montserrat">
													{chat.lastMessage}
												</p>
												{chat.unread > 0 && (
													<span className="ml-2 bg-dark-accent text-dark-bg text-xs px-2 py-1 rounded-full shrink-0 font-montserrat font-semibold">
														{chat.unread}
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{activeTab === "friends" && (
					<div className="space-y-6">
						{/* Friend Requests */}
						<SectionCard className="border-0 bg-transparent p-0">
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-3">
									<span className="text-2xl">👋</span>
									<h3 className="text-xl font-bold text-landing-slate font-titillium">
										Friend Requests
									</h3>
									<span className="bg-dark-accent text-dark-bg text-xs px-2 py-1 rounded-full font-montserrat font-semibold">
										3
									</span>
								</div>
							</div>
							<div className="space-y-3">
								{[
									{
										user: "David Park",
										avatar: "DP",
										info: "Learning AI Ethics • 12 mutual friends",
										time: "2 days ago",
									},
									{
										user: "Lisa Wong",
										avatar: "LW",
										info: "Python Developer • 8 mutual friends",
										time: "3 days ago",
									},
									{
										user: "Carlos Martinez",
										avatar: "CM",
										info: "Data Science Student • 5 mutual friends",
										time: "5 days ago",
									},
								].map((request) => (
									<div
										key={request.user}
										className="flex items-center gap-4 p-4 bg-dark-surface/50 rounded-2xl border border-dark-border"
									>
										<div className="w-14 h-14 rounded-full bg-dark-accent/20 flex items-center justify-center font-bold shrink-0 text-dark-accent border border-dark-accent/30">
											{request.avatar}
										</div>
										<div className="flex-1 min-w-0">
											<h4 className="font-semibold text-dark-text font-montserrat">
												{request.user}
											</h4>
											<p className="text-sm text-dark-muted truncate font-montserrat">
												{request.info}
											</p>
											<p className="text-xs text-dark-muted mt-1 font-montserrat">
												{request.time}
											</p>
										</div>
										<div className="flex gap-2 shrink-0">
											<button
												type="button"
												className="bg-dark-accent hover:bg-dark-accent/90 text-dark-bg px-4 py-2 rounded-xl font-semibold text-sm transition font-montserrat"
											>
												Accept
											</button>
											<button
												type="button"
												className="bg-dark-border hover:bg-red-600/30 text-red-600 px-4 py-2 rounded-xl font-semibold text-sm transition font-montserrat"
											>
												Decline
											</button>
										</div>
									</div>
								))}
							</div>
						</SectionCard>

						{/* My Friends */}
						<SectionCard className="border-0 bg-transparent p-0">
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-3">
									<span className="text-2xl">👥</span>
									<h3 className="text-xl font-bold text-landing-slate font-titillium">
										My Friends
									</h3>
									<span className="text-sm text-dark-muted font-montserrat">
										(24 friends)
									</span>
								</div>
								<button
									type="button"
									className="text-dark-accent hover:text-dark-accent/80 text-sm font-semibold transition font-montserrat"
								>
									See All
								</button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{[
									{
										user: "Sarah Chen",
										avatar: "SC",
										status: "Currently learning: Neural Networks",
										streak: "15 day streak 🔥",
										online: true,
										cardBg: "bg-dark-surface border-dark-border",
									},
									{
										user: "Alex Kumar",
										avatar: "AK",
										status: "Completed 8 courses this month",
										streak: "Top 10% learner 🏆",
										online: true,
										cardBg: "bg-dark-surface border-dark-border",
									},
									{
										user: "Emma Rodriguez",
										avatar: "ER",
										status: "Studying AI Safety",
										streak: "30 day streak 🔥",
										online: false,
										cardBg: "bg-dark-surface border-dark-border",
									},
									{
										user: "James Wilson",
										avatar: "JW",
										status: "Taking a break",
										streak: "Joined 3 months ago",
										online: false,
										cardBg: "bg-dark-surface border-dark-border",
									},
								].map((friend) => (
									<div
										key={friend.user}
										className={`p-4 rounded-2xl hover:opacity-95 transition border-2 ${friend.cardBg}`}
									>
										<div className="flex items-center gap-3 mb-3">
											<div className="relative">
												<div className="w-12 h-12 rounded-full bg-linear-to-br from-landing-hero-bg to-landing-magenta flex items-center justify-center font-bold text-white border-2 border-white/50">
													{friend.avatar}
												</div>
												{friend.online && (
													<div className="absolute bottom-0 right-0 w-3 h-3 bg-dark-accent rounded-full border-2 border-dark-surface" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="font-semibold text-dark-text font-montserrat">
													{friend.user}
												</h4>
												<p className="text-xs text-dark-muted font-montserrat">
													{friend.streak}
												</p>
											</div>
										</div>
										<p className="text-sm text-dark-muted mb-3 truncate font-montserrat">
											{friend.status}
										</p>
										<div className="flex gap-2">
											<button
												type="button"
												className="flex-1 bg-dark-accent hover:bg-dark-accent/90 text-dark-bg px-3 py-2 rounded-xl text-sm font-semibold transition font-montserrat"
											>
												Message
											</button>
											<button
												type="button"
												className="flex-1 bg-dark-border hover:bg-dark-border/80 text-dark-text px-3 py-2 rounded-xl text-sm font-semibold transition font-montserrat"
											>
												View
											</button>
										</div>
									</div>
								))}
							</div>
						</SectionCard>

						{/* Leaderboard */}
						<SectionCard className="border-0 bg-transparent p-0">
							<div className="flex items-center gap-3 mb-5">
								<span className="text-2xl">🏆</span>
								<h3 className="text-xl font-bold text-dark-accent font-titillium">
									Friends Leaderboard
								</h3>
							</div>
							<p className="text-sm text-dark-muted mb-4 font-montserrat">
								See how you rank among your friends this week
							</p>
							<div className="space-y-3">
								{[
									{
										rank: 1,
										user: "Emma Rodriguez",
										xp: "2,450 XP",
										rowBg: "bg-dark-accent/10 border-dark-accent",
										avatarBg: "from-dark-accent to-dark-border",
									},
									{
										rank: 2,
										user: "You",
										xp: "2,180 XP",
										rowBg: "bg-dark-accent/10 border-dark-accent",
										avatarBg: "from-dark-accent to-dark-border",
									},
									{
										rank: 3,
										user: "Alex Kumar",
										xp: "1,920 XP",
										rowBg: "bg-dark-surface border-dark-border",
										avatarBg: "from-dark-accent to-dark-border",
									},
								].map((entry) => (
									<div
										key={entry.rank}
										className={`flex items-center gap-4 p-3 rounded-xl border-2 ${entry.rowBg}`}
									>
										<div className="text-2xl font-bold text-dark-text font-titillium">
											#{entry.rank}
										</div>
										<div
											className={`w-10 h-10 rounded-full bg-linear-to-br ${entry.avatarBg} flex items-center justify-center font-bold text-sm text-white border-2 border-white/50`}
										>
											{entry.user.charAt(0)}
										</div>
										<div className="flex-1">
											<p className="font-semibold text-dark-text font-montserrat">
												{entry.user}
											</p>
											<p className="text-sm text-dark-muted font-montserrat">
												{entry.xp}
											</p>
										</div>
										{entry.rank === 1 && <span className="text-2xl">👑</span>}
									</div>
								))}
							</div>
						</SectionCard>
					</div>
				)}
			</div>
		</div>
	);
}

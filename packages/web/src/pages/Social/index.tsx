import { usePanthaContext } from "@pantha/react";
import {
	useFollowUser,
	useFriendsLeaderboard,
	useGetFeed,
	useLearningGroupMembers,
	useSearchUsers,
	useSelfFriends,
	useUnfollowUser,
	useUserFollowing,
	useUserInfo,
	useUserLearningGroups,
	useWeeklyLeaderboard,
} from "@pantha/react/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader, MessageCircle, Plus, Search, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import Icon from "../../shared/components/Icon";
import PageHeaderWithStats from "../../shared/components/PageHeaderWithStats";

function LearningGroupCard({
	group,
	onOpen,
}: {
	group: Record<string, unknown>;
	onOpen: () => void;
}) {
	const { data: members, isLoading } = useLearningGroupMembers(
		group.id as number,
	);

	return (
		<button
			type="button"
			onClick={onOpen}
			className="w-full p-4 bg-dark-surface/50 rounded-2xl border border-dark-border hover:border-dark-accent/50 transition group text-left"
		>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-full bg-linear-to-br from-dark-accent to-dark-border flex items-center justify-center font-bold text-dark-bg">
						{((group.name as string) ?? "G").charAt(0).toUpperCase()}
					</div>
					<div className="flex-1 min-w-0">
						<h4 className="font-semibold text-dark-text font-montserrat truncate">
							{group.name as string}
						</h4>
						<p className="text-xs text-dark-muted font-montserrat">
							{isLoading ? (
								<Loader className="w-3 h-3 inline animate-spin" />
							) : (
								`${members?.length ?? 0} members`
							)}
						</p>
					</div>
				</div>
				<MessageCircle className="w-5 h-5 text-dark-muted group-hover:text-dark-accent transition" />
			</div>
			<p className="text-xs text-dark-muted font-montserrat">
				{(group.description as string) || "No description"}
			</p>
		</button>
	);
}

function ChatPreviewCard({
	name,
	lastMessage,
	time,
	onOpen,
}: {
	name: string;
	lastMessage: string;
	time: string;
	onOpen: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onOpen}
			className="w-full p-4 bg-dark-surface/50 rounded-2xl border border-dark-border hover:border-dark-accent/50 transition group text-left"
		>
			<div className="flex items-center gap-4">
				<div className="w-12 h-12 rounded-full bg-linear-to-br from-dark-accent to-dark-border flex items-center justify-center font-bold text-dark-bg shrink-0">
					{name.charAt(0).toUpperCase()}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-1">
						<h4 className="font-semibold text-dark-text font-montserrat truncate">
							{name}
						</h4>
						<span className="text-xs text-dark-muted shrink-0 font-montserrat">
							{time}
						</span>
					</div>
					<p className="text-sm text-dark-muted truncate font-montserrat">
						{lastMessage}
					</p>
				</div>
				<MessageCircle className="w-5 h-5 text-dark-muted group-hover:text-dark-accent transition shrink-0" />
			</div>
		</button>
	);
}

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

function WeeklyLeaderboardEntry({
	entry,
	idx,
}: {
	entry: { userWallet: string; totalXp: number; rank?: number };
	idx: number;
}) {
	const queryClient = useQueryClient();
	const cached = queryClient.getQueryData<{ user: { username: string } }>([
		"userInfo",
		entry.userWallet,
	]);
	const { data: userInfo } = useUserInfo({
		walletAddress: entry.userWallet as string,
	});

	const rank = (entry as { rank?: number }).rank ?? idx + 1;
	const w = entry.userWallet as string;
	const username = userInfo?.user?.username ?? cached?.user?.username ?? null;
	const short = `${w.slice(0, 6)}...${w.slice(-4)}`;
	const displayName = username ? `${username} (${short})` : short;
	const isTop = rank === 1;

	return (
		<div
			key={entry.userWallet}
			className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
				isTop
					? "bg-dark-surface border-dark-accent"
					: "bg-dark-surface border-dark-border"
			}`}
		>
			<div className="flex items-center gap-4">
				<div className="text-2xl font-bold text-dark-accent font-titillium">
					#{rank}
				</div>
				<div>
					<h4 className="font-semibold text-dark-text font-montserrat">
						{displayName}
					</h4>
					<p className="text-sm text-dark-muted font-montserrat">
						{(entry.totalXp as number).toLocaleString()} XP this week
					</p>
				</div>
			</div>
			{isTop && <span className="text-2xl">👑</span>}
		</div>
	);
}

function FriendsLeaderboardEntry({
	entry,
	idx,
}: {
	entry: { userWallet: string; totalXp: number; rank?: number };
	idx: number;
}) {
	const queryClient = useQueryClient();
	const cached = queryClient.getQueryData<{ user: { username: string } }>([
		"userInfo",
		entry.userWallet,
	]);
	const { data: userInfo } = useUserInfo({
		walletAddress: entry.userWallet as string,
	});

	const rank = (entry as { rank?: number }).rank ?? idx + 1;
	const w = entry.userWallet as string;
	const username = userInfo?.user?.username ?? cached?.user?.username ?? null;
	const avatarText = (username ?? w).slice(0, 2).toUpperCase();
	const short = `${w.slice(0, 6)}...${w.slice(-4)}`;
	const displayName = username ? `${username} (${short})` : short;
	const isTop = rank === 1;

	return (
		<div
			key={entry.userWallet}
			className={`flex items-center gap-4 p-3 rounded-xl border-2 ${
				isTop
					? "bg-dark-accent/10 border-dark-accent"
					: "bg-dark-surface border-dark-border"
			}`}
		>
			<div className="text-2xl font-bold text-dark-text font-titillium">
				#{rank}
			</div>
			<div className="w-10 h-10 rounded-full bg-linear-to-br from-dark-accent to-dark-border flex items-center justify-center font-bold text-sm text-white border-2 border-white/50">
				{avatarText}
			</div>
			<div className="flex-1">
				<p className="font-semibold text-dark-text font-montserrat">
					{displayName}
				</p>
				<p className="text-sm text-dark-muted font-montserrat">
					{(entry.totalXp as number).toLocaleString()} XP
				</p>
			</div>
			{isTop && <span className="text-2xl">👑</span>}
		</div>
	);
}

function FriendChatEntry({
	friend,
	onOpen,
}: {
	friend: {
		wallet: string;
		username?: string | null;
		streak: { currentStreak: number };
	};
	onOpen: (walletAddress: Address) => void;
}) {
	const queryClient = useQueryClient();
	const cached = queryClient.getQueryData<{ user: { username: string } }>([
		"userInfo",
		friend.wallet,
	]);
	const { data: userInfo } = useUserInfo({
		walletAddress: friend.wallet,
	});

	const short = `${friend.wallet.slice(0, 6)}...${friend.wallet.slice(-4)}`;
	const username =
		userInfo?.user?.username ??
		cached?.user?.username ??
		friend.username ??
		null;
	const displayName = username ?? short;

	return (
		<ChatPreviewCard
			name={displayName}
			lastMessage="Click to start chatting"
			time=""
			onOpen={() => onOpen(friend.wallet as Address)}
		/>
	);
}

function MyFriendCardEntry({
	friend,
	onOpen,
}: {
	friend: {
		wallet: string;
		username?: string | null;
		streak: { currentStreak: number };
	};
	onOpen: (walletAddress: Address) => void;
}) {
	const queryClient = useQueryClient();
	const cached = queryClient.getQueryData<{ user: { username: string } }>([
		"userInfo",
		friend.wallet,
	]);
	const { data: userInfo } = useUserInfo({
		walletAddress: friend.wallet,
	});

	const short = `${friend.wallet.slice(0, 6)}...${friend.wallet.slice(-4)}`;
	const username =
		userInfo?.user?.username ??
		cached?.user?.username ??
		friend.username ??
		null;
	const displayName = username ?? short;
	const avatarText = (username ?? friend.wallet).slice(0, 2).toUpperCase();

	return (
		<div className="p-4 rounded-2xl hover:opacity-95 transition border-2 bg-dark-surface border-dark-border">
			<div className="flex items-center gap-3 mb-3">
				<div className="w-12 h-12 rounded-full bg-linear-to-br from-landing-hero-bg to-landing-magenta flex items-center justify-center font-bold text-white border-2 border-white/50">
					{avatarText}
				</div>
				<div className="flex-1 min-w-0">
					<h4 className="font-semibold text-dark-text font-montserrat truncate">
						{displayName}
					</h4>
					<p className="text-xs text-dark-muted font-montserrat truncate">
						{short}
					</p>
					{friend.streak.currentStreak > 0 && (
						<p className="text-xs text-dark-muted font-montserrat">
							{friend.streak.currentStreak} day streak 🔥
						</p>
					)}
				</div>
			</div>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => onOpen(friend.wallet as Address)}
					className="flex-1 bg-dark-accent hover:bg-dark-accent/90 text-dark-bg px-3 py-2 rounded-xl text-sm font-semibold transition font-montserrat"
				>
					Message
				</button>
			</div>
		</div>
	);
}

function UserSearchBar({
	onOpenChat,
}: {
	onOpenChat: (walletAddress: Address) => void;
}) {
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
							{users.map((user: Record<string, unknown>) => {
								const walletAddress = user.walletAddress as string;
								const username = (user.username as string) ?? "?";
								const name = user.name as string | undefined;
								const isFollowing = followingSet.has(walletAddress);
								const isSelf = wallet?.account.address === walletAddress;

								return (
									<div
										key={walletAddress}
										className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition border-b border-dark-border last:border-0"
									>
										<div className="w-10 h-10 rounded-full bg-dark-accent flex items-center justify-center font-bold text-sm shrink-0 text-dark-bg">
											{username.charAt(0).toUpperCase()}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-dark-text truncate font-montserrat">
												{username}
											</p>
											{name && (
												<p className="text-xs text-dark-muted truncate font-montserrat">
													{name}
												</p>
											)}
										</div>
										<div className="flex items-center gap-2 shrink-0">
											{!isSelf && (
												<button
													type="button"
													onClick={() => onOpenChat(walletAddress as Address)}
													className="bg-dark-accent hover:bg-dark-accent/90 text-dark-bg px-3 py-2 rounded-lg text-xs font-semibold transition font-montserrat whitespace-nowrap"
												>
													Message
												</button>
											)}
											{!isSelf &&
												(isFollowing ? (
													<button
														type="button"
														onClick={() =>
															handleUnfollow(walletAddress as Address)
														}
														className="bg-dark-border hover:bg-dark-border/80 text-dark-text px-3 py-2 rounded-lg text-xs font-semibold transition font-montserrat whitespace-nowrap"
													>
														Unfollow
													</button>
												) : (
													<button
														type="button"
														onClick={() =>
															handleFollow(walletAddress as Address)
														}
														className="bg-dark-accent/20 hover:bg-dark-accent/30 text-dark-accent px-3 py-2 rounded-lg text-xs font-semibold transition font-montserrat whitespace-nowrap"
													>
														Follow
													</button>
												))}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default function Social() {
	const [activeTab, setActiveTab] = useState<Tab>("feed");
	const navigate = useNavigate();

	// Load learning groups and personal chats data
	const { data: learningGroups, isLoading: groupsLoading } =
		useUserLearningGroups();

	const feedData = useGetFeed();

	const { data: selfFriendsData, isLoading: followingLoading } =
		useSelfFriends();
	const myFriends = selfFriendsData?.friends ?? [];
	const { data: friendsLeaderboard, isLoading: leaderboardLoading } =
		useFriendsLeaderboard();
	const { data: weeklyLeaderboard, isLoading: weeklyLoading } =
		useWeeklyLeaderboard();

	// Navigate to the Messages page with personal chat params
	const handleOpenPersonalChat = useCallback(
		(walletAddress: Address) => {
			const formattedWallet = (walletAddress || "").toLowerCase() as Address;
			if (!formattedWallet || !formattedWallet.startsWith("0x")) return;
			navigate({
				to: "/messages",
				search: {
					type: "personal",
					address: formattedWallet,
					name: `${formattedWallet.slice(0, 6)}...`,
					chatId: undefined,
				},
			});
		},
		[navigate],
	);

	// Navigate to the Messages page with group chat params
	const handleOpenGroupChat = useCallback(
		(group: Record<string, unknown>) => {
			navigate({
				to: "/messages",
				search: {
					type: "group",
					chatId: group.id as number,
					name: group.name as string,
					address: undefined,
				},
			});
		},
		[navigate],
	);

	return (
		<div className="dark min-h-screen text-dark-text">
			<div className="pt-6 bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg px-4 pb-24">
				<div className="max-w-4xl mx-auto">
					<PageHeaderWithStats
						badge="Community"
						title="Social"
						subtitle="Connect with friends, share progress, and learn together."
					/>

					{/* User Search */}
					<UserSearchBar onOpenChat={handleOpenPersonalChat} />

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
											Practice consistently! Studies show that learning in
											short, daily sessions is more effective than cramming. Try
											to complete at least one chapter every day to maintain
											your streak.
										</p>
										<div className="flex items-center gap-2 text-xs text-dark-muted font-montserrat font-semibold">
											<span>📚</span>
											<span>Based on your progress</span>
										</div>
									</div>
								</div>
							</SectionCard>

							{/* Weekly Leaderboard */}
							<SectionCard className="border-0 bg-transparent p-0">
								<div className="flex items-center gap-3 mb-5">
									<span className="text-2xl">🔥</span>
									<h3 className="text-xl font-bold text-dark-accent font-titillium">
										Weekly Leaderboard
									</h3>
								</div>
								{weeklyLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader className="w-6 h-6 animate-spin text-dark-accent" />
									</div>
								) : !weeklyLeaderboard || weeklyLeaderboard.length === 0 ? (
									<p className="text-sm text-dark-muted font-montserrat text-center py-6">
										No leaderboard data yet this week.
									</p>
								) : (
									<div className="space-y-3">
										{weeklyLeaderboard
											.filter((e) => !!e.userWallet)
											.map((entry, idx) => (
												<WeeklyLeaderboardEntry
													key={entry.userWallet}
													entry={entry}
													idx={idx}
												/>
											))}
									</div>
								)}
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
									{feedData.isLoading ? (
										<div className="flex items-center justify-center py-8">
											<Loader className="w-6 h-6 animate-spin text-dark-accent" />
										</div>
									) : feedData.data && feedData.data.length > 0 ? (
										feedData.data.map((post) => {
											const displayName =
												post.username ??
												`${post.userWallet.slice(0, 6)}...${post.userWallet.slice(-4)}`;
											const avatarText = displayName.slice(0, 2).toUpperCase();
											const isStreak = post.payload.type === "streak-extension";
											const action = isStreak
												? `extended their streak to ${(post.payload as { newStreak: number }).newStreak} days 🔥`
												: "completed a chapter 📚";
											const relativeTime = (() => {
												const diff =
													Date.now() - new Date(post.createdAt).getTime();
												const mins = Math.floor(diff / 60_000);
												if (mins < 1) return "just now";
												if (mins < 60) return `${mins}m ago`;
												const hrs = Math.floor(mins / 60);
												if (hrs < 24) return `${hrs}h ago`;
												return `${Math.floor(hrs / 24)}d ago`;
											})();
											return (
												<div
													key={post.id}
													className="flex items-start gap-4 p-4 bg-dark-surface/50 rounded-2xl hover:bg-dark-surface transition border border-dark-border"
												>
													<div className="w-12 h-12 rounded-full bg-linear-to-br from-dark-accent to-dark-border flex items-center justify-center font-bold text-sm shrink-0 text-white border-2 border-white/50">
														{avatarText}
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm mb-1 font-montserrat">
															<span className="font-semibold text-dark-text">
																{displayName}
															</span>
															<span className="text-dark-muted"> {action}</span>
														</p>
														<div className="flex items-center gap-3 text-xs font-montserrat">
															<span className="text-dark-muted">
																{relativeTime}
															</span>
														</div>
													</div>
												</div>
											);
										})
									) : (
										<div className="text-center py-8 text-dark-muted">
											<p className="text-sm font-montserrat">
												Nothing in your feed yet. Follow people to see their
												activity!
											</p>
										</div>
									)}
								</div>
							</SectionCard>
						</div>
					)}

					{activeTab === "chats" && (
						<div className="space-y-6">
							{/* Learning Groups Section */}
							<SectionCard className="border-0 bg-transparent p-0">
								<div className="flex items-center justify-between mb-5">
									<div className="flex items-center gap-3">
										<Users className="w-6 h-6 text-dark-accent" />
										<h3 className="text-xl font-bold text-dark-accent font-titillium">
											My Learning Groups
										</h3>
										<span className="bg-dark-accent text-dark-bg text-xs px-2 py-1 rounded-full font-montserrat font-semibold">
											{learningGroups?.length ?? 0}
										</span>
									</div>
									<button
										type="button"
										className="text-dark-accent hover:text-dark-accent/80 transition font-montserrat text-sm"
									>
										<Plus className="w-5 h-5" />
									</button>
								</div>

								{groupsLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader className="w-6 h-6 animate-spin text-dark-accent" />
									</div>
								) : learningGroups && learningGroups.length > 0 ? (
									<div className="space-y-3">
										{(learningGroups as Record<string, unknown>[]).map(
											(group: Record<string, unknown>) => (
												<LearningGroupCard
													key={String(group.id)}
													group={group}
													onOpen={() => handleOpenGroupChat(group)}
												/>
											),
										)}
									</div>
								) : (
									<div className="text-center py-8 text-dark-muted">
										<p className="text-sm font-montserrat">
											No learning groups yet. Create or join one to get started!
										</p>
									</div>
								)}
							</SectionCard>

							{/* Direct Messages Section */}
							<SectionCard className="border-0 bg-transparent p-0">
								<div className="flex items-center justify-between mb-5">
									<div className="flex items-center gap-3">
										<MessageCircle className="w-6 h-6 text-dark-accent" />
										<h3 className="text-xl font-bold text-dark-accent font-titillium">
											Direct Messages
										</h3>
									</div>
									<button
										type="button"
										className="text-dark-accent hover:text-dark-accent/80 transition"
									>
										<Plus className="w-5 h-5" />
									</button>
								</div>

								{followingLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader className="w-6 h-6 animate-spin text-dark-accent" />
									</div>
								) : myFriends.length === 0 ? (
									<div className="text-center py-8 text-dark-muted">
										<p className="text-sm font-montserrat">
											No friends yet. Add some to start chatting!
										</p>
									</div>
								) : (
									<div className="space-y-3">
										{myFriends.map(
											(friend: {
												wallet: string;
												username?: string | null;
												streak: { currentStreak: number };
											}) => (
												<FriendChatEntry
													key={friend.wallet}
													friend={friend}
													onOpen={handleOpenPersonalChat}
												/>
											),
										)}
									</div>
								)}
							</SectionCard>
						</div>
					)}

					{activeTab === "friends" && (
						<div className="space-y-6">
							{/* My Friends */}
							<SectionCard className="border-0 bg-transparent p-0">
								<div className="flex items-center justify-between mb-5">
									<div className="flex items-center gap-3">
										<span className="text-2xl">👥</span>
										<h3 className="text-xl font-bold text-landing-slate font-titillium">
											My Friends
										</h3>
										<span className="text-sm text-dark-muted font-montserrat">
											({myFriends.length} friends)
										</span>
									</div>
								</div>
								{followingLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader className="w-6 h-6 animate-spin text-dark-accent" />
									</div>
								) : myFriends.length === 0 ? (
									<div className="text-center py-8 text-dark-muted">
										<p className="text-sm font-montserrat">
											No friends yet. Follow each other to appear here!
										</p>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{myFriends.map(
											(friend: {
												wallet: string;
												username?: string | null;
												streak: { currentStreak: number };
											}) => (
												<MyFriendCardEntry
													key={friend.wallet}
													friend={friend}
													onOpen={handleOpenPersonalChat}
												/>
											),
										)}
									</div>
								)}
							</SectionCard>

							{/* Friends Leaderboard */}
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
								{leaderboardLoading ? (
									<div className="flex items-center justify-center py-8">
										<Loader className="w-6 h-6 animate-spin text-dark-accent" />
									</div>
								) : !friendsLeaderboard || friendsLeaderboard.length === 0 ? (
									<p className="text-sm text-dark-muted font-montserrat text-center py-6">
										No friends on the leaderboard yet.
									</p>
								) : (
									<div className="space-y-3">
										{friendsLeaderboard
											.filter((e) => !!e.userWallet)
											.map((entry, idx) => (
												<FriendsLeaderboardEntry
													key={entry.userWallet}
													entry={entry}
													idx={idx}
												/>
											))}
									</div>
								)}
							</SectionCard>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

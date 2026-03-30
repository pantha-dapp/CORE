import { usePanthaContext } from "@pantha/react";
import {
	useEncryptionService,
	useFollowUser,
	useFriendsLeaderboard,
	useGetFeed,
	useLearningGroupMembers,
	useLearningGroupMessages,
	usePersonalMessages,
	useSearchUsers,
	useSelfFriends,
	useSendLearningGroupMessage,
	useSendPersonalMessage,
	useUnfollowUser,
	useUserFollowing,
	useUserLearningGroups,
	useWeeklyLeaderboard,
} from "@pantha/react/hooks";
import { useQuery } from "@tanstack/react-query";
import {
	Loader,
	MessageCircle,
	Plus,
	Search,
	Send,
	Users,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import Icon from "../../shared/components/Icon";
import PageHeaderWithStats from "../../shared/components/PageHeaderWithStats";

// Helper Components for Chat - Full-screen view
function ChatWindow({
	session,
	onClose,
	onSendMessage,
	isSending,
	sendError,
}: {
	session: ChatSession;
	onClose: () => void;
	onSendMessage: (content: string, onSuccess: () => void) => void;
	isSending?: boolean;
	sendError?: string | null;
}) {
	const [messageText, setMessageText] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Keygen readiness (only matters for personal DMs)
	const { isKeygenReady, isKeygenPending, keygenError } =
		useEncryptionService();
	// Only block input while actively setting up keys — NOT on error or when wallet is not connected
	const keygenNotReady =
		session.type === "personal" && !isKeygenReady && isKeygenPending;

	// Check if the recipient has registered their encryption keys on-chain
	const { contracts, wallet } = usePanthaContext();
	const recipientAddress =
		session.type === "personal" ? session.walletAddress : undefined;
	const { data: recipientIsRegistered, isLoading: checkingRecipient } =
		useQuery({
			queryKey: ["recipientRegistered", recipientAddress],
			queryFn: async () => {
				if (!contracts || !recipientAddress) return null;
				return contracts.PanthaKeyStore.read.isRegistered([recipientAddress]);
			},
			enabled: session.type === "personal" && !!recipientAddress && !!contracts,
			staleTime: 60_000,
		});
	const recipientNotReady =
		session.type === "personal" &&
		!checkingRecipient &&
		recipientIsRegistered === false;

	// Load messages based on chat type
	const personalMessages = usePersonalMessages(
		session.type === "personal" && session.walletAddress
			? session.walletAddress
			: undefined,
	);
	const groupMessages = useLearningGroupMessages(
		session.type === "group" ? session.chatId : undefined,
	);

	const messages =
		session.type === "personal" ? personalMessages : groupMessages;
	const isLoading = messages.isLoading;
	// Reverse pages (oldest page first) then reverse within each page (oldest msg first)
	// so the final array is oldest message at index 0 → renders top-to-bottom correctly
	const pageMessages = [...(messages.data?.pages ?? [])]
		.reverse()
		.flatMap((p) => [...(p.messages as unknown[])].reverse());

	// Auto-scroll to latest message
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [pageMessages]);

	const handleSend = () => {
		const trimmed = messageText.trim();
		if (!trimmed) return;
		console.log(
			"[ChatWindow] handleSend called, session:",
			session.type,
			session.walletAddress ?? session.chatId,
		);
		onSendMessage(trimmed, () => setMessageText(""));
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg flex flex-col pb-24 md:pb-0">
			{/* Header */}
			<div className="sticky top-0 z-40 flex items-center justify-between p-4 md:p-6 border-b border-dark-border bg-dark-surface/40 backdrop-blur-xl">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-dark-border rounded-lg transition"
					>
						<X className="w-5 h-5 text-dark-muted" />
					</button>
					<div>
						<h2 className="font-bold text-dark-text font-montserrat text-lg">
							{session.name}
						</h2>
						<p className="text-xs text-dark-muted font-montserrat">
							{session.type === "personal" ? "Direct Message" : "Group Chat"}
						</p>
					</div>
				</div>
			</div>

			{/* Messages Container */}
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full pb-4">
				{isLoading ? (
					<div className="flex items-center justify-center h-full min-h-96">
						<Loader className="w-8 h-8 animate-spin text-dark-accent" />
					</div>
				) : pageMessages.length === 0 ? (
					<div className="flex items-center justify-center h-full min-h-96 text-dark-muted">
						<p className="text-sm">No messages yet. Start a conversation!</p>
					</div>
				) : (
					pageMessages.map((msg) => {
						const msgTyped = msg as {
							id?: number;
							senderWallet?: string;
							senderAddress?: string;
							plaintext?: string;
							content?: string;
							createdAt?: string;
						};
						const senderWallet =
							msgTyped.senderWallet ?? msgTyped.senderAddress;
						const isMine =
							senderWallet?.toLowerCase() ===
							wallet?.account.address?.toLowerCase();
						return (
							<div
								key={msgTyped.id}
								className={`flex ${isMine ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-md px-4 py-3 rounded-2xl ${
										isMine
											? "bg-dark-accent text-dark-bg rounded-br-sm"
											: "bg-dark-border text-dark-text rounded-bl-sm"
									}`}
								>
									<p className="text-sm font-montserrat">
										{msgTyped.plaintext || msgTyped.content}
									</p>
									<p
										className={`text-xs opacity-70 mt-2 font-montserrat text-right`}
									>
										{msgTyped.createdAt
											? new Date(msgTyped.createdAt).toLocaleTimeString()
											: ""}
									</p>
								</div>
							</div>
						);
					})
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input - Fixed above bottom nav */}
			<div className="fixed bottom-[72px] left-0 right-0 md:static p-4 md:p-6 border-t border-dark-border bg-dark-surface/95 backdrop-blur-xl md:mt-auto z-50 w-full">
				<div className="max-w-4xl mx-auto flex flex-col gap-1">
					{/* Keygen banner — shown while keypair is registering */}
					{keygenNotReady && !keygenError && (
						<div className="flex items-center gap-2 text-xs text-dark-muted font-montserrat px-1 mb-1">
							<Loader className="w-3 h-3 animate-spin shrink-0" />
							{isKeygenPending
								? "Setting up your encryption keys… please wait"
								: "Checking encryption key status…"}
						</div>
					)}
					{keygenError && (
						<p className="text-xs text-red-400 font-montserrat px-1 mb-1">
							Encryption setup failed: {keygenError}
						</p>
					)}
					{/* Recipient banner — shown when recipient hasn't registered their keys */}
					{recipientNotReady && (
						<p className="text-xs text-amber-400 font-montserrat px-1 mb-1">
							This user hasn't set up encryption yet. They need to open the app
							before you can message them.
						</p>
					)}
					<div className="flex gap-3">
						<input
							type="text"
							placeholder={
								keygenNotReady
									? "Waiting for encryption setup..."
									: recipientNotReady
										? "Recipient can't receive messages yet..."
										: "Type a message..."
							}
							value={messageText}
							onChange={(e) => setMessageText(e.target.value)}
							onKeyDown={(e) =>
								e.key === "Enter" &&
								!isSending &&
								!keygenNotReady &&
								!recipientNotReady &&
								handleSend()
							}
							disabled={isSending || keygenNotReady || recipientNotReady}
							className="flex-1 bg-dark-surface/80 border border-dark-border rounded-xl px-4 py-3 text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-dark-accent/40 font-montserrat disabled:opacity-60"
						/>
						<button
							type="button"
							onClick={handleSend}
							disabled={
								!messageText.trim() ||
								isSending ||
								keygenNotReady ||
								recipientNotReady
							}
							className="bg-dark-accent hover:bg-dark-accent/90 disabled:opacity-50 text-dark-bg px-6 py-3 rounded-xl transition font-semibold font-montserrat"
						>
							{isSending ? (
								<Loader className="w-5 h-5 animate-spin" />
							) : (
								<Send className="w-5 h-5" />
							)}
						</button>
					</div>
					{sendError && (
						<p className="text-xs text-red-400 font-montserrat px-1">
							Failed to send: {sendError}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

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
type ChatType = "personal" | "group";

interface ChatSession {
	id: string;
	type: ChatType;
	name: string;
	avatar: string;
	walletAddress?: Address;
	chatId?: number;
}

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
	const [activeChat, setActiveChat] = useState<ChatSession | null>(null);

	// Load learning groups and personal chats data
	const { data: learningGroups, isLoading: groupsLoading } =
		useUserLearningGroups();

	// Mutations for sending messages
	const sendPersonalMessage = useSendPersonalMessage();
	const sendGroupMessage = useSendLearningGroupMessage();
	const feedData = useGetFeed();

	const { data: selfFriendsData, isLoading: followingLoading } =
		useSelfFriends();
	const myFriends = selfFriendsData?.friends ?? [];
	const { data: friendsLeaderboard, isLoading: leaderboardLoading } =
		useFriendsLeaderboard();
	const { data: weeklyLeaderboard, isLoading: weeklyLoading } =
		useWeeklyLeaderboard();

	// Handle opening personal chat
	const handleOpenPersonalChat = useCallback((walletAddress: Address) => {
		console.log("[Social] handleOpenPersonalChat called with:", walletAddress);
		// Ensure wallet address is properly formatted
		const formattedWallet = (walletAddress || "").toLowerCase() as Address;
		if (!formattedWallet || !formattedWallet.startsWith("0x")) {
			console.error("[Social] Invalid wallet address:", walletAddress);
			return;
		}
		console.log("[Social] Opening personal chat with wallet:", formattedWallet);
		setActiveChat({
			id: formattedWallet,
			type: "personal",
			name: `${formattedWallet.slice(0, 6)}...`,
			avatar: formattedWallet.charAt(2).toUpperCase(),
			walletAddress: formattedWallet,
		});
	}, []);

	// Handle opening group chat
	const handleOpenGroupChat = useCallback((group: Record<string, unknown>) => {
		setActiveChat({
			id: String(group.id),
			type: "group",
			name: group.name as string,
			avatar: ((group.name as string) ?? "G").charAt(0).toUpperCase(),
			chatId: group.id as number,
		});
	}, []);

	// Handle sending message
	const handleSendMessage = useCallback(
		(content: string, onSuccess: () => void) => {
			if (!activeChat) {
				console.warn(
					"[Social] handleSendMessage called but activeChat is null",
				);
				return;
			}

			console.log("[Social] handleSendMessage", {
				type: activeChat.type,
				walletAddress: activeChat.walletAddress,
				chatId: activeChat.chatId,
				contentLength: content.length,
			});

			if (activeChat.type === "personal" && activeChat.walletAddress) {
				console.log(
					"[Social] calling sendPersonalMessage.mutate with recipient:",
					activeChat.walletAddress,
				);
				sendPersonalMessage.mutate(
					{ recipient: activeChat.walletAddress, message: content },
					{
						onSuccess: (result) => {
							if (result.success) onSuccess();
						},
					},
				);
			} else if (activeChat.type === "group" && activeChat.chatId) {
				console.log(
					"[Social] calling sendGroupMessage.mutate with chatId:",
					activeChat.chatId,
				);
				sendGroupMessage.mutate(
					{ chatId: activeChat.chatId, content },
					{ onSuccess: () => onSuccess() },
				);
			} else {
				console.error(
					"[Social] handleSendMessage: missing walletAddress or chatId",
					activeChat,
				);
			}
		},
		[activeChat, sendGroupMessage, sendPersonalMessage],
	);

	return (
		<div className="dark min-h-screen text-dark-text">
			{/* Show full-screen chat when active, otherwise show social feed */}
			{activeChat ? (
				<ChatWindow
					session={activeChat}
					onClose={() => setActiveChat(null)}
					onSendMessage={handleSendMessage}
					isSending={
						sendPersonalMessage.isPending || sendGroupMessage.isPending
					}
					sendError={
						sendPersonalMessage.isError
							? (sendPersonalMessage.error as Error)?.message
							: sendGroupMessage.isError
								? (sendGroupMessage.error as Error)?.message
								: null
					}
				/>
			) : (
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
												short, daily sessions is more effective than cramming.
												Try to complete at least one chapter every day to
												maintain your streak.
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
												.map((entry, idx) => {
													const rank =
														(entry as { rank?: number }).rank ?? idx + 1;
													const w = entry.userWallet as string;
													const short = `${w.slice(0, 6)}...${w.slice(-4)}`;
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
																		{short}
																	</h4>
																	<p className="text-sm text-dark-muted font-montserrat">
																		{entry.totalXp.toLocaleString()} XP this
																		week
																	</p>
																</div>
															</div>
															{isTop && <span className="text-2xl">👑</span>}
														</div>
													);
												})}
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
												const avatarText = displayName
													.slice(0, 2)
													.toUpperCase();
												const isStreak =
													post.payload.type === "streak-extension";
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
																<span className="text-dark-muted">
																	{" "}
																	{action}
																</span>
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
												No learning groups yet. Create or join one to get
												started!
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
											{myFriends.map((friend) => {
												const short = `${friend.wallet.slice(0, 6)}...${friend.wallet.slice(-4)}`;
												return (
													<ChatPreviewCard
														key={friend.wallet}
														name={short}
														lastMessage="Click to start chatting"
														time=""
														onOpen={() =>
															handleOpenPersonalChat(friend.wallet as Address)
														}
													/>
												);
											})}
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
											{myFriends.map((friend) => {
												const short = `${friend.wallet.slice(0, 6)}...${friend.wallet.slice(-4)}`;
												const avatarText = friend.wallet
													.slice(2, 4)
													.toUpperCase();
												return (
													<div
														key={friend.wallet}
														className="p-4 rounded-2xl hover:opacity-95 transition border-2 bg-dark-surface border-dark-border"
													>
														<div className="flex items-center gap-3 mb-3">
															<div className="w-12 h-12 rounded-full bg-linear-to-br from-landing-hero-bg to-landing-magenta flex items-center justify-center font-bold text-white border-2 border-white/50">
																{avatarText}
															</div>
															<div className="flex-1 min-w-0">
																<h4 className="font-semibold text-dark-text font-montserrat truncate">
																	{short}
																</h4>
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
																onClick={() =>
																	handleOpenPersonalChat(
																		friend.wallet as Address,
																	)
																}
																className="flex-1 bg-dark-accent hover:bg-dark-accent/90 text-dark-bg px-3 py-2 rounded-xl text-sm font-semibold transition font-montserrat"
															>
																Message
															</button>
														</div>
													</div>
												);
											})}
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
												.map((entry, idx) => {
													const rank =
														(entry as { rank?: number }).rank ?? idx + 1;
													const w = entry.userWallet as string;
													const avatarText = w.slice(2, 4).toUpperCase();
													const short = `${w.slice(0, 6)}...${w.slice(-4)}`;
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
																	{short}
																</p>
																<p className="text-sm text-dark-muted font-montserrat">
																	{entry.totalXp.toLocaleString()} XP
																</p>
															</div>
															{isTop && <span className="text-2xl">👑</span>}
														</div>
													);
												})}
										</div>
									)}
								</SectionCard>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

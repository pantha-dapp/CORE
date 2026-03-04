import { usePanthaContext } from "@pantha/react";
import {
	useFriendProfileView,
	useLogout,
	useSelfFriends,
	useUserFollowers,
	useUserFollowing,
	useUserInfo,
	useUserUpdateProfile,
} from "@pantha/react/hooks";
import { useLogout as usePrivyLogout } from "@privy-io/react-auth";
import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import type { JSX } from "react/jsx-runtime";
import type { Address } from "viem";
import Button from "../../shared/components/Button";

type SocialTab = "friends" | "followers" | "following";

export default function Profile(): JSX.Element {
	const { logout: logoutPrivy } = usePrivyLogout();
	const router = useRouter();
	const [openSettings, setOpenSettings] = useState(false);
	const [openEditProfile, setOpenEditProfile] = useState(false);
	const [editName, setEditName] = useState("");
	const [editUsername, setEditUsername] = useState("");
	const [editVisibility, setEditVisibility] = useState<"public" | "private">(
		"public",
	);
	const [socialTab, setSocialTab] = useState<SocialTab>("friends");
	const [selectedFriend, setSelectedFriend] = useState<Address | null>(null);
	const { mutateAsync: logoutPantha } = useLogout();
	const { wallet } = usePanthaContext();
	const walletAddress = wallet?.account.address;
	const { data: userInfo } = useUserInfo({ walletAddress });
	const { data: userFollowers } = useUserFollowers({ walletAddress });
	const { data: userFollowing } = useUserFollowing({ walletAddress });
	const { data: selfFriends } = useSelfFriends();
	const { data: friendProfile, isLoading: friendProfileLoading } =
		useFriendProfileView({ walletAddress: selectedFriend ?? undefined });
	const { mutateAsync: updateUserProfile, isPending: isUpdating } =
		useUserUpdateProfile();

	const streak = userInfo?.user?.streak?.currentStreak ?? 0;
	const followersCount = userFollowers?.followers.length ?? 0;
	const followingCount = userFollowing?.following.length ?? 0;
	const friendsCount = selfFriends?.friends.length ?? 0;

	const truncateWallet = (addr: string) =>
		`${addr.slice(0, 6)}...${addr.slice(-4)}`;

	return (
		<>
			<div className="min-h-screen bg-gray-900 text-white px-4 py-6 pb-28">
				<div className="max-w-lg mx-auto space-y-4">
					{/* ── Top Bar ── */}
					<div className="flex items-center justify-between mb-2">
						<h1 className="text-2xl font-extrabold tracking-tight">Profile</h1>
						<button
							type="button"
							onClick={() => setOpenSettings(true)}
							className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-xl transition-colors"
							aria-label="Settings"
						>
							⚙️
						</button>
					</div>

					{/* ── Profile Card ── */}
					<div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 flex items-center gap-4">
						{/* Avatar + streak badge */}
						<div className="relative shrink-0">
							<img
								src={`https://api.dicebear.com/7.x/bottts/svg?seed=${walletAddress ?? "default"}`}
								alt="avatar"
								className="w-20 h-20 rounded-full border-4 border-primary bg-gray-700"
							/>
							{streak > 0 && (
								<span className="absolute -bottom-1 -right-1 bg-amber-500 text-xs font-extrabold rounded-full px-1.5 py-0.5 border-2 border-gray-800 leading-none">
									🔥{streak}
								</span>
							)}
						</div>

						{/* Info */}
						<div className="flex-1 min-w-0">
							<h2 className="text-xl font-extrabold truncate leading-tight">
								{userInfo?.user?.name ?? "—"}
							</h2>

							<p className="text-sm text-white/50 truncate">
								@{userInfo?.user?.username ?? "—"}
							</p>
							{walletAddress && (
								<p className="text-xs text-white/30 font-mono mt-0.5">
									{truncateWallet(walletAddress)}
								</p>
							)}
							{userInfo?.user?.timezone && (
								<p className="text-xs text-white/35 mt-0.5">
									🌍 {userInfo.user.timezone}
								</p>
							)}
							<p className="text-sm text-white/50 truncate">
								@{userInfo?.user?.profileVisibility ?? "—"}
							</p>
						</div>
					</div>

					{/* ── Sign Out ── */}
					<Button
						variant="danger"
						fullWidth
						onClick={async () => {
							await Promise.all([logoutPrivy(), logoutPantha()]);
							router.navigate({ to: "/login", replace: true });
						}}
					>
						Sign Out
					</Button>

					{/* ── Stats Row ── */}
					<div className="grid grid-cols-2 gap-3">
						<StatCard
							icon="🔥"
							label="Day Streak"
							value={`${streak} days`}
							valueColor="text-amber-400"
							border="border-amber-500/25"
							bg="bg-amber-500/10"
						/>
						<StatCard
							icon="👫"
							label="Friends"
							value={String(friendsCount)}
							valueColor="text-cyan-400"
							border="border-cyan-500/25"
							bg="bg-cyan-500/10"
						/>
					</div>

					{/* ── Social Card ── */}
					<div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
						{/* Summary row */}
						<div className="grid grid-cols-3 divide-x divide-gray-700 border-b border-gray-700">
							<SocialSummaryItem
								label="Followers"
								count={followersCount}
								active={socialTab === "followers"}
								onClick={() => setSocialTab("followers")}
							/>
							<SocialSummaryItem
								label="Following"
								count={followingCount}
								active={socialTab === "following"}
								onClick={() => setSocialTab("following")}
							/>
							<SocialSummaryItem
								label="Friends"
								count={friendsCount}
								active={socialTab === "friends"}
								onClick={() => setSocialTab("friends")}
							/>
						</div>

						{/* Tab list */}
						<div className="p-4 space-y-1 max-h-60 overflow-y-auto">
							{socialTab === "friends" && (
								<>
									{!selfFriends?.friends.length ? (
										<EmptyState
											emoji="🤝"
											text="No friends yet — follow users back to become friends!"
										/>
									) : (
										selfFriends.friends.map((addr) => (
											<WalletRow
												key={addr}
												address={addr}
												label="Friend"
												labelColor="text-cyan-400"
												onClick={() => setSelectedFriend(addr as Address)}
											/>
										))
									)}
								</>
							)}
							{socialTab === "followers" && (
								<>
									{!userFollowers?.followers.length ? (
										<EmptyState emoji="🙈" text="No followers yet." />
									) : (
										userFollowers.followers.map((addr) => (
											<WalletRow
												key={addr}
												address={addr}
												label="Follower"
												labelColor="text-violet-400"
											/>
										))
									)}
								</>
							)}
							{socialTab === "following" && (
								<>
									{!userFollowing?.following.length ? (
										<EmptyState emoji="🔭" text="Not following anyone yet." />
									) : (
										userFollowing.following.map((addr) => (
											<WalletRow
												key={addr}
												address={addr}
												label="Following"
												labelColor="text-green-400"
											/>
										))
									)}
								</>
							)}
						</div>
					</div>

					{/* ── Find Friends CTA ── */}
					<Button
						variant="primary"
						fullWidth
						onClick={() => router.navigate({ to: "/login", replace: true })}
					>
						🔍 Find Friends
					</Button>
				</div>
			</div>

			{/* ── Friend Profile Sheet ── */}
			{selectedFriend && (
				<div className="fixed inset-0 z-50 flex items-end">
					<button
						type="button"
						aria-label="Close friend profile"
						className="absolute inset-0 bg-black/60 backdrop-blur-sm w-full"
						onClick={() => setSelectedFriend(null)}
					/>
					<div className="relative w-full max-h-[90vh] bg-gray-900 border-t border-gray-700 rounded-t-3xl animate-slide-up flex flex-col">
						{/* handle */}
						<div className="shrink-0 pt-3 pb-1 flex justify-center">
							<div className="w-10 h-1 bg-gray-600 rounded-full" />
						</div>

						{/* Header */}
						<div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-800">
							<h2 className="text-lg font-extrabold">Friend Profile</h2>
							<button
								type="button"
								onClick={() => setSelectedFriend(null)}
								className="text-white/40 hover:text-white text-xl p-1 transition-colors"
							>
								✕
							</button>
						</div>

						{/* Scrollable content */}
						<div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">
							{friendProfileLoading ? (
								<div className="text-center py-16 text-white/30">
									<p className="text-4xl mb-2">⏳</p>
									<p className="text-sm">Loading profile…</p>
								</div>
							) : friendProfile ? (
								<>
									{/* Avatar + info */}
									<div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex items-center gap-4">
										<div className="relative shrink-0">
											<img
												src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedFriend}`}
												alt="avatar"
												className="w-16 h-16 rounded-full border-4 border-cyan-500 bg-gray-700"
											/>
											{(friendProfile.profile.streak?.currentStreak ?? 0) >
												0 && (
												<span className="absolute -bottom-1 -right-1 bg-amber-500 text-xs font-extrabold rounded-full px-1.5 py-0.5 border-2 border-gray-800 leading-none">
													🔥{friendProfile.profile.streak.currentStreak}
												</span>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="text-lg font-extrabold truncate">
												{friendProfile.profile.name ?? "—"}
											</h3>
											<p className="text-sm text-white/50 truncate">
												@{friendProfile.profile.username ?? "—"}
											</p>
											<p className="text-xs text-white/30 font-mono mt-0.5">
												{truncateWallet(selectedFriend)}
											</p>
											{friendProfile.profile.timezone && (
												<p className="text-xs text-white/35 mt-0.5">
													🌍 {friendProfile.profile.timezone}
												</p>
											)}
										</div>
									</div>

									{/* Stats */}
									<div className="grid grid-cols-3 gap-2">
										<MiniStat
											label="Streak"
											value={`🔥 ${friendProfile.profile.streak?.currentStreak ?? 0}`}
										/>
										<MiniStat
											label="Friends"
											value={`👫 ${friendProfile.profile.friends.length}`}
										/>
										<MiniStat
											label="Courses"
											value={`📚 ${friendProfile.profile.courses.length}`}
										/>
									</div>

									{/* Courses */}
									{friendProfile.profile.courses.length > 0 && (
										<div className="space-y-2">
											<p className="text-xs font-bold uppercase tracking-widest text-white/30">
												Courses
											</p>
											{friendProfile.profile.courses.map((c) => (
												<div
													key={c.id}
													className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex justify-between items-center"
												>
													<p className="text-sm font-semibold truncate">
														{c.courseId}
													</p>
													<span className="text-xs text-green-400 font-bold ml-2 shrink-0">
														{c.progress}%
													</span>
												</div>
											))}
										</div>
									)}

									{/* Followers / Following */}
									<div className="grid grid-cols-2 gap-2">
										<MiniStat
											label="Followers"
											value={String(friendProfile.profile.followers.length)}
										/>
										<MiniStat
											label="Following"
											value={String(friendProfile.profile.following.length)}
										/>
									</div>
								</>
							) : (
								<EmptyState
									emoji="🔒"
									text="Profile not available. You may not be mutual friends."
								/>
							)}
						</div>

						<div className="shrink-0 pb-8" />
					</div>
				</div>
			)}

			{/* ── Settings Bottom Sheet ── */}
			{openSettings && (
				<div className="fixed inset-0 z-50 flex items-end">
					{/* Backdrop */}
					<button
						type="button"
						aria-label="Close settings"
						className="absolute inset-0 bg-black/60 backdrop-blur-sm w-full"
						onClick={() => setOpenSettings(false)}
					/>
					{/* Sheet — flex column keeps Sign Out always visible */}
					<div className="relative w-full max-h-[85vh] bg-gray-900 border-t border-gray-700 rounded-t-3xl animate-slide-up flex flex-col">
						{/* ── Fixed top: handle + header ── */}
						<div className="shrink-0 px-6 pt-4 pb-3 border-b border-gray-800">
							<div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-extrabold">Settings</h2>
								<button
									type="button"
									onClick={() => setOpenSettings(false)}
									className="text-white/40 hover:text-white text-xl transition-colors p-1"
								>
									✕
								</button>
							</div>
						</div>

						{/* ── Scrollable middle: settings items only ── */}
						<div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-5">
							<SettingsSection title="Account">
								<SettingsItem
									icon="✏️"
									label="Edit Profile"
									onClick={() => {
										setEditName(userInfo?.user?.name ?? "");
										setEditUsername(userInfo?.user?.username ?? "");
										setEditVisibility(
											userInfo?.user?.profileVisibility === "private"
												? "private"
												: "public",
										);
										setOpenEditProfile(true);
									}}
								/>
								<SettingsItem icon="📧" label="Change Email" />
								<SettingsItem icon="🔑" label="Change Password" />
							</SettingsSection>

							<SettingsSection title="Preferences">
								<SettingsItem icon="🔊" label="Sound Effects" />
								<SettingsItem icon="🔔" label="Notifications" />
								<SettingsItem icon="📚" label="Course Preferences" />
							</SettingsSection>

							<SettingsSection title="Privacy">
								<SettingsItem icon="👁️" label="Profile Visibility" />
								<SettingsItem icon="🚫" label="Blocked Users" />
							</SettingsSection>

							<SettingsSection title="Support">
								<SettingsItem icon="❓" label="Help Center" />
								<SettingsItem icon="💬" label="Send Feedback" />
							</SettingsSection>
						</div>

						{/* ── Fixed bottom: padding for home indicator ── */}
						<div className="shrink-0 pb-8" />
					</div>
				</div>
			)}

			{/* ── Edit Profile Bottom Sheet ── */}
			{openEditProfile && (
				<div className="fixed inset-0 z-60 flex items-end">
					<button
						type="button"
						aria-label="Close edit profile"
						className="absolute inset-0 bg-black/60 backdrop-blur-sm w-full"
						onClick={() => setOpenEditProfile(false)}
					/>
					<div className="relative w-full max-h-[85vh] bg-gray-900 border-t border-gray-700 rounded-t-3xl animate-slide-up flex flex-col">
						{/* Handle + Header */}
						<div className="shrink-0 px-6 pt-4 pb-3 border-b border-gray-800">
							<div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-extrabold">Edit Profile</h2>
								<button
									type="button"
									onClick={() => setOpenEditProfile(false)}
									className="text-white/40 hover:text-white text-xl transition-colors p-1"
								>
									✕
								</button>
							</div>
						</div>

						{/* Form Fields */}
						<div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
							{/* Name */}
							<div className="space-y-1.5">
								<label
									htmlFor="edit-name"
									className="text-xs font-bold uppercase tracking-widest text-white/40"
								>
									Name
								</label>
								<input
									id="edit-name"
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									placeholder="Your display name"
									className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-primary transition-colors"
								/>
							</div>

							{/* Username */}
							<div className="space-y-1.5">
								<label
									htmlFor="edit-username"
									className="text-xs font-bold uppercase tracking-widest text-white/40"
								>
									Username
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
										@
									</span>
									<input
										id="edit-username"
										type="text"
										value={editUsername}
										onChange={(e) => setEditUsername(e.target.value)}
										placeholder="your_username"
										className="w-full bg-white/5 border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-primary transition-colors"
									/>
								</div>
							</div>

							{/* Profile Visibility */}
							<div className="space-y-1.5">
								<p className="text-xs font-bold uppercase tracking-widest text-white/40">
									Profile Visibility
								</p>
								<div className="flex gap-3">
									<button
										type="button"
										onClick={() => setEditVisibility("public")}
										className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${
											editVisibility === "public"
												? "bg-primary/15 border-primary text-primary"
												: "bg-white/5 border-gray-700 text-white/50 hover:bg-white/10"
										}`}
									>
										🌍 Public
									</button>
									<button
										type="button"
										onClick={() => setEditVisibility("private")}
										className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${
											editVisibility === "private"
												? "bg-violet-500/15 border-violet-500 text-violet-400"
												: "bg-white/5 border-gray-700 text-white/50 hover:bg-white/10"
										}`}
									>
										🔒 Private
									</button>
								</div>
							</div>
						</div>

						{/* Save Button */}
						<div className="shrink-0 px-6 py-4 border-t border-gray-800">
							<Button
								variant="primary"
								fullWidth
								onClick={async () => {
									await updateUserProfile({
										name: editName || undefined,
										username: editUsername || undefined,
										profileVisibility: editVisibility,
									});
									setOpenEditProfile(false);
								}}
							>
								{isUpdating ? "Saving…" : "Save Changes"}
							</Button>
						</div>

						<div className="shrink-0 pb-8" />
					</div>
				</div>
			)}
		</>
	);
}
/* ── Sub-components ── */

function StatCard({
	icon,
	label,
	value,
	valueColor,
	border,
	bg,
}: {
	icon: string;
	label: string;
	value: string;
	valueColor: string;
	border: string;
	bg: string;
}) {
	return (
		<div
			className={`border rounded-2xl p-4 flex items-center gap-3 ${bg} ${border}`}
		>
			<span className="text-3xl leading-none">{icon}</span>
			<div>
				<p className={`text-xl font-extrabold leading-tight ${valueColor}`}>
					{value}
				</p>
				<p className="text-xs text-white/40">{label}</p>
			</div>
		</div>
	);
}

function SocialSummaryItem({
	label,
	count,
	active,
	onClick,
}: {
	label: string;
	count: number;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`py-3 text-center w-full transition-colors ${
				active ? "bg-gray-700/60" : "hover:bg-white/5"
			}`}
		>
			<p
				className={`text-lg font-extrabold ${active ? "text-white" : "text-white/60"}`}
			>
				{count}
			</p>
			<p className={`text-xs ${active ? "text-white/60" : "text-white/35"}`}>
				{label}
			</p>
			{active && (
				<div className="mt-1 mx-auto w-8 h-0.5 bg-primary rounded-full" />
			)}
		</button>
	);
}

function WalletRow({
	address,
	label,
	labelColor,
	onClick,
}: {
	address: string;
	label: string;
	labelColor: string;
	onClick?: () => void;
}) {
	const inner = (
		<>
			<img
				src={`https://api.dicebear.com/7.x/bottts/svg?seed=${address}`}
				alt="avatar"
				className="w-9 h-9 rounded-full bg-gray-700 shrink-0"
			/>
			<p className="font-mono text-sm text-white/60 flex-1 truncate">
				{`${address.slice(0, 6)}...${address.slice(-4)}`}
			</p>
			<span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
			{onClick && <span className="text-white/20 text-sm">›</span>}
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-left"
			>
				{inner}
			</button>
		);
	}

	return (
		<div className="flex items-center gap-3 px-2 py-2 rounded-xl">{inner}</div>
	);
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
	return (
		<div className="text-center py-8 text-white/30">
			<p className="text-4xl mb-2">{emoji}</p>
			<p className="text-sm">{text}</p>
		</div>
	);
}

function MiniStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
			<p className="text-base font-extrabold">{value}</p>
			<p className="text-xs text-white/40 mt-0.5">{label}</p>
		</div>
	);
}

function SettingsSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-bold uppercase tracking-widest text-white/30 px-1 mb-2">
				{title}
			</p>
			<div className="space-y-1">{children}</div>
		</div>
	);
}

function SettingsItem({
	icon,
	label,
	onClick,
}: {
	icon: string;
	label: string;
	onClick?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl text-left transition-colors"
		>
			<span className="text-base">{icon}</span>
			<span className="text-sm font-medium">{label}</span>
			<span className="ml-auto text-white/20">›</span>
		</button>
	);
}

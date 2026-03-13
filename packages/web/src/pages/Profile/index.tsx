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
import { DotsBackground } from "../../shared/components/DotsBackground";
import { useTheme } from "../../shared/contexts/ThemeContext";

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
	const { theme, toggleTheme } = useTheme();

	const streak = userInfo?.user?.streak?.currentStreak ?? 0;
	const followersCount = userFollowers?.followers.length ?? 0;
	const followingCount = userFollowing?.following.length ?? 0;
	const friendsCount = selfFriends?.friends.length ?? 0;

	const truncateWallet = (addr: string) =>
		`${addr.slice(0, 6)}...${addr.slice(-4)}`;

	return (
		<>
			<div className="min-h-screen relative overflow-hidden bg-landing-hero-bg dark:bg-dark-bg">
				<DotsBackground className="absolute inset-0 dark:opacity-30" />
				<div className="absolute inset-3 rounded-lg pointer-events-none bg-landing-hero-bg dark:bg-dark-bg" />
				<div className="absolute inset-3 border-4 border-black dark:border-dark-border rounded-lg pointer-events-none" />
				<div className="absolute inset-6 pointer-events-auto overflow-y-auto px-4 py-6 pb-28">
					<div className="max-w-lg mx-auto space-y-4">
						{/* ── Top Bar ── */}
						<div className="flex items-center justify-between mb-2">
							<h1 className="text-2xl font-bold tracking-tight text-landing-hero-text dark:text-gray-100 font-tusker">
								Profile
							</h1>
							<button
								type="button"
								onClick={() => setOpenSettings(true)}
								className="p-2 rounded-lg bg-white dark:bg-dark-card border-2 border-black dark:border-dark-border hover:opacity-90 text-xl transition-opacity font-montserrat"
								aria-label="Settings"
							>
								⚙️
							</button>
						</div>

						{/* ── Profile Card ── */}
						<div className="bg-white dark:bg-dark-card border-2 border-black dark:border-dark-border rounded-lg p-5 flex items-center gap-4">
							{/* Avatar + streak badge */}
							<div className="relative shrink-0">
								<img
									src={`https://api.dicebear.com/7.x/bottts/svg?seed=${walletAddress ?? "default"}`}
									alt="avatar"
									className="w-20 h-20 rounded-full border-4 border-landing-button-primary dark:border-gray-500 bg-gray-100 dark:bg-dark-surface"
								/>
								{streak > 0 && (
									<span className="absolute -bottom-1 -right-1 bg-amber-500 text-xs font-bold rounded-full px-1.5 py-0.5 border-2 border-white leading-none font-montserrat">
										🔥{streak}
									</span>
								)}
							</div>

							{/* Info */}
							<div className="flex-1 min-w-0">
								<h2 className="text-xl font-bold truncate leading-tight text-gray-900 dark:text-gray-100 font-tusker">
									{userInfo?.user?.name ?? "—"}
								</h2>

								<p className="text-sm text-gray-500 dark:text-dark-muted truncate font-montserrat">
									@{userInfo?.user?.username ?? "—"}
								</p>
								{walletAddress && (
									<p className="text-xs text-gray-400 dark:text-dark-muted font-mono mt-0.5">
										{truncateWallet(walletAddress)}
									</p>
								)}
								{userInfo?.user?.timezone && (
									<p className="text-xs text-gray-500 mt-0.5 font-montserrat">
										🌍 {userInfo.user.timezone}
									</p>
								)}
								<p className="text-sm text-gray-500 truncate font-montserrat">
									{userInfo?.user?.profileVisibility ?? "—"}
								</p>
							</div>
						</div>

						{/* ── Sign Out ── */}
						<button
							type="button"
							onClick={async () => {
								await Promise.all([logoutPrivy(), logoutPantha()]);
								router.navigate({ to: "/login", replace: true });
							}}
							className="w-full py-3 px-4 rounded-lg font-medium bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 transition-colors font-montserrat"
						>
							Sign Out
						</button>

						{/* ── Stats Row ── */}
						<div className="grid grid-cols-2 gap-3">
							<StatCard icon="🔥" label="Day Streak" value={`${streak} days`} />
							<StatCard
								icon="👫"
								label="Friends"
								value={String(friendsCount)}
							/>
						</div>

						{/* ── Social Card ── */}
						<div className="bg-white dark:bg-dark-card border-2 border-black dark:border-dark-border rounded-lg overflow-hidden">
							{/* Summary row */}
							<div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-600 border-b-2 border-black dark:border-dark-border">
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
								{socialTab === "friends" &&
									(!selfFriends?.friends.length ? (
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
												labelColor="text-cyan-600"
												onClick={() => setSelectedFriend(addr as Address)}
											/>
										))
									))}
								{socialTab === "followers" &&
									(!userFollowers?.followers.length ? (
										<EmptyState emoji="🙈" text="No followers yet." />
									) : (
										userFollowers.followers.map((addr) => (
											<WalletRow
												key={addr}
												address={addr}
												label="Follower"
												labelColor="text-violet-600"
											/>
										))
									))}
								{socialTab === "following" &&
									(!userFollowing?.following.length ? (
										<EmptyState emoji="🔭" text="Not following anyone yet." />
									) : (
										userFollowing.following.map((addr) => (
											<WalletRow
												key={addr}
												address={addr}
												label="Following"
												labelColor="text-green-600"
											/>
										))
									))}
							</div>
						</div>

						{/* ── Find Friends CTA ── */}
						<button
							type="button"
							onClick={() => router.navigate({ to: "/social", replace: false })}
							className="w-full py-3 px-4 rounded-lg font-medium bg-landing-button-primary dark:bg-dark-surface text-white hover:opacity-90 dark:hover:bg-gray-600 transition-colors font-montserrat"
						>
							🔍 Find Friends
						</button>
					</div>
				</div>
			</div>

			{/* ── Friend Profile Sheet ── */}
			{selectedFriend && (
				<div className="fixed inset-0 z-50 flex items-end">
					<button
						type="button"
						aria-label="Close friend profile"
						className="absolute inset-0 bg-black/40 w-full"
						onClick={() => setSelectedFriend(null)}
					/>
					<div className="relative w-full max-h-[90vh] bg-white dark:bg-dark-card border-t-4 border-black dark:border-dark-border rounded-t-2xl animate-slide-up flex flex-col">
						{/* handle */}
						<div className="shrink-0 pt-3 pb-1 flex justify-center">
							<div className="w-10 h-1 bg-gray-300 dark:bg-dark-surface0 rounded-full" />
						</div>

						{/* Header */}
						<div className="shrink-0 flex items-center justify-between px-5 py-3 border-b-2 border-gray-200 dark:border-dark-border">
							<h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-tusker">
								Friend Profile
							</h2>
							<button
								type="button"
								onClick={() => setSelectedFriend(null)}
								className="text-gray-500 hover:text-gray-900 text-xl p-1 transition-colors"
							>
								✕
							</button>
						</div>

						{/* Scrollable content */}
						<div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">
							{friendProfileLoading ? (
								<div className="text-center py-16 text-gray-500 font-montserrat">
									<p className="text-4xl mb-2">⏳</p>
									<p className="text-sm">Loading profile…</p>
								</div>
							) : friendProfile ? (
								<>
									{/* Avatar + info */}
									<div className="bg-gray-50 dark:bg-dark-surface border-2 border-gray-200 dark:border-dark-border rounded-lg p-4 flex items-center gap-4">
										<div className="relative shrink-0">
											<img
												src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedFriend}`}
												alt="avatar"
												className="w-16 h-16 rounded-full border-2 border-landing-button-primary bg-gray-100"
											/>
											{(friendProfile.profile.streak?.currentStreak ?? 0) >
												0 && (
												<span className="absolute -bottom-1 -right-1 bg-amber-500 text-xs font-bold rounded-full px-1.5 py-0.5 border-2 border-white leading-none font-montserrat">
													🔥{friendProfile.profile.streak.currentStreak}
												</span>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="text-lg font-bold truncate text-gray-900 dark:text-gray-100 font-tusker">
												{friendProfile.profile.name ?? "—"}
											</h3>
											<p className="text-sm text-gray-500 dark:text-dark-muted truncate font-montserrat">
												@{friendProfile.profile.username ?? "—"}
											</p>
											<p className="text-xs text-gray-400 dark:text-dark-muted font-mono mt-0.5">
												{truncateWallet(selectedFriend)}
											</p>
											{friendProfile.profile.timezone && (
												<p className="text-xs text-gray-500 mt-0.5 font-montserrat">
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
											<p className="text-xs font-bold uppercase tracking-widest text-gray-500 font-tusker">
												Courses
											</p>
											{friendProfile.profile.courses.map((c) => (
												<div
													key={c.id}
													className="bg-gray-50 dark:bg-dark-surface border-2 border-gray-200 dark:border-dark-border rounded-lg px-4 py-3 flex justify-between items-center"
												>
													<p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100 font-montserrat">
														{c.courseId}
													</p>
													<span className="text-xs text-green-600 font-bold ml-2 shrink-0 font-montserrat">
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
						className="absolute inset-0 bg-black/40 w-full"
						onClick={() => setOpenSettings(false)}
					/>
					{/* Sheet — flex column keeps Sign Out always visible */}
					<div className="relative w-full max-h-[85vh] bg-white dark:bg-dark-card border-t-4 border-black dark:border-dark-border rounded-t-2xl animate-slide-up flex flex-col">
						{/* ── Fixed top: handle + header ── */}
						<div className="shrink-0 px-6 pt-4 pb-3 border-b-2 border-gray-200 dark:border-dark-border">
							<div className="w-10 h-1 bg-gray-300 dark:bg-dark-surface0 rounded-full mx-auto mb-3" />
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-tusker">
									Settings
								</h2>
								<button
									type="button"
									onClick={() => setOpenSettings(false)}
									className="text-gray-500 dark:text-dark-muted hover:text-gray-900 dark:hover:text-gray-100 text-xl transition-colors p-1"
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
										setOpenSettings(false);
										setTimeout(() => setOpenEditProfile(true), 200);
									}}
								/>
								<SettingsItem icon="📧" label="Change Email" />
								<SettingsItem icon="🔑" label="Change Password" />
							</SettingsSection>

							<SettingsSection title="Appearance">
								<SettingsToggleItem
									icon="🌙"
									label="Dark Mode"
									checked={theme === "dark"}
									onToggle={toggleTheme}
								/>
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
						className="absolute inset-0 bg-black/40 w-full"
						onClick={() => setOpenEditProfile(false)}
					/>
					<div className="relative w-full max-h-[85vh] bg-white dark:bg-dark-card border-t-4 border-black dark:border-dark-border rounded-t-2xl animate-slide-up flex flex-col">
						{/* Handle + Header */}
						<div className="shrink-0 px-6 pt-4 pb-3 border-b-2 border-gray-200 dark:border-dark-border">
							<div className="w-10 h-1 bg-gray-300 dark:bg-dark-surface0 rounded-full mx-auto mb-3" />
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-tusker">
									Edit Profile
								</h2>
								<button
									type="button"
									onClick={() => setOpenEditProfile(false)}
									className="text-gray-500 dark:text-dark-muted hover:text-gray-900 dark:hover:text-gray-100 text-xl transition-colors p-1"
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
									className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-dark-muted font-tusker"
								>
									Name
								</label>
								<input
									id="edit-name"
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									placeholder="Your display name"
									className="w-full bg-gray-50 dark:bg-dark-surface border-2 border-gray-200 dark:border-dark-border rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-landing-button-primary dark:focus:border-gray-500 transition-colors font-montserrat"
								/>
							</div>

							{/* Username */}
							<div className="space-y-1.5">
								<label
									htmlFor="edit-username"
									className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-dark-muted font-tusker"
								>
									Username
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted text-sm font-montserrat">
										@
									</span>
									<input
										id="edit-username"
										type="text"
										value={editUsername}
										onChange={(e) => setEditUsername(e.target.value)}
										placeholder="your_username"
										className="w-full bg-gray-50 dark:bg-dark-surface border-2 border-gray-200 dark:border-dark-border rounded-lg pl-8 pr-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-landing-button-primary dark:focus:border-gray-500 transition-colors font-montserrat"
									/>
								</div>
							</div>

							{/* Profile Visibility */}
							<div className="space-y-1.5">
								<p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-dark-muted font-tusker">
									Profile Visibility
								</p>
								<div className="flex gap-3">
									<button
										type="button"
										onClick={() => setEditVisibility("public")}
										className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-semibold transition-colors font-montserrat ${
											editVisibility === "public"
												? "bg-landing-button-light-bg dark:bg-dark-surface border-landing-button-primary dark:border-gray-500 text-gray-900 dark:text-gray-100"
												: "bg-gray-50 dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-muted hover:border-gray-300 dark:hover:border-gray-500"
										}`}
									>
										🌍 Public
									</button>
									<button
										type="button"
										onClick={() => setEditVisibility("private")}
										className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-semibold transition-colors font-montserrat ${
											editVisibility === "private"
												? "bg-violet-100 dark:bg-violet-900/20 border-violet-500 dark:border-violet-400 text-violet-700 dark:text-violet-300"
												: "bg-gray-50 dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-muted hover:border-gray-300 dark:hover:border-gray-500"
										}`}
									>
										🔒 Private
									</button>
								</div>
							</div>
						</div>

						{/* Save Button */}
						<div className="shrink-0 px-6 py-4 border-t-2 border-gray-200 dark:border-dark-border">
							<button
								type="button"
								onClick={async () => {
									await updateUserProfile({
										name: editName || undefined,
										username: editUsername || undefined,
										profileVisibility: editVisibility,
									});
									setOpenEditProfile(false);
								}}
								disabled={isUpdating}
								className="w-full py-3 px-4 rounded-lg font-medium bg-landing-button-primary dark:bg-dark-surface text-white hover:opacity-90 dark:hover:bg-gray-600 transition-opacity disabled:opacity-70 font-montserrat"
							>
								{isUpdating ? "Saving…" : "Save Changes"}
							</button>
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
}: {
	icon: string;
	label: string;
	value: string;
}) {
	return (
		<div className="bg-white dark:bg-dark-card border-2 border-black dark:border-dark-border rounded-lg p-4 flex items-center gap-3">
			<span className="text-3xl leading-none">{icon}</span>
			<div>
				<p className="text-xl font-bold leading-tight text-gray-900 dark:text-gray-100 font-tusker">
					{value}
				</p>
				<p className="text-xs text-gray-500 dark:text-dark-muted font-montserrat">
					{label}
				</p>
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
			className={`py-3 text-center w-full transition-colors font-montserrat ${
				active
					? "bg-gray-100 dark:bg-dark-surface"
					: "hover:bg-gray-50 dark:hover:bg-dark-surface/50"
			}`}
		>
			<p
				className={`text-lg font-bold ${active ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-dark-muted"} font-tusker`}
			>
				{count}
			</p>
			<p
				className={`text-xs ${active ? "text-gray-600 dark:text-dark-text" : "text-gray-400 dark:text-dark-muted"} font-montserrat`}
			>
				{label}
			</p>
			{active && (
				<div className="mt-1 mx-auto w-8 h-0.5 bg-landing-button-primary dark:bg-dark-accent rounded-full" />
			)}
		</button>
	);
}

function WalletRow({
	address,
	label,
	labelColor = "text-gray-600",
	onClick,
}: {
	address: string;
	label: string;
	labelColor?: string;
	onClick?: () => void;
}) {
	const inner = (
		<>
			<img
				src={`https://api.dicebear.com/7.x/bottts/svg?seed=${address}`}
				alt="avatar"
				className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-gray-500 shrink-0"
			/>
			<p className="font-mono text-sm text-gray-600 dark:text-dark-text flex-1 truncate">
				{`${address.slice(0, 6)}...${address.slice(-4)}`}
			</p>
			<span className={`text-xs font-semibold ${labelColor} font-montserrat`}>
				{label}
			</span>
			{onClick && <span className="text-gray-400 text-sm">›</span>}
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-surface active:bg-gray-100 dark:active:bg-dark-surface transition-colors text-left"
			>
				{inner}
			</button>
		);
	}

	return (
		<div className="flex items-center gap-3 px-2 py-2 rounded-lg">{inner}</div>
	);
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
	return (
		<div className="text-center py-8 text-gray-500 dark:text-dark-muted font-montserrat">
			<p className="text-4xl mb-2">{emoji}</p>
			<p className="text-sm">{text}</p>
		</div>
	);
}

function MiniStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-gray-50 dark:bg-dark-surface border-2 border-gray-200 dark:border-dark-border rounded-lg p-3 text-center">
			<p className="text-base font-bold text-gray-900 dark:text-gray-100 font-tusker">
				{value}
			</p>
			<p className="text-xs text-gray-500 dark:text-dark-muted mt-0.5 font-montserrat">
				{label}
			</p>
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
			<p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-dark-muted px-1 mb-2 font-tusker">
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
			className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 dark:bg-dark-card dark:hover:bg-dark-surface dark:border-dark-border border-2 border-gray-200 px-4 py-3 rounded-lg text-left transition-colors font-montserrat"
		>
			<span className="text-base">{icon}</span>
			<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
				{label}
			</span>
			<span className="ml-auto text-gray-400 dark:text-dark-muted">›</span>
		</button>
	);
}

function SettingsToggleItem({
	icon,
	label,
	checked,
	onToggle,
}: {
	icon: string;
	label: string;
	checked: boolean;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 dark:bg-dark-card dark:hover:bg-dark-surface dark:border-dark-border border-2 border-gray-200 px-4 py-3 rounded-lg text-left transition-colors font-montserrat"
		>
			<span className="text-base">{icon}</span>
			<span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
				{label}
			</span>
			<div
				className={`w-11 h-6 rounded-full transition-colors relative ${
					checked
						? "bg-landing-hero-bg dark:bg-dark-accent"
						: "bg-gray-300 dark:bg-dark-surface"
				}`}
			>
				<div
					className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
						checked ? "translate-x-6" : "translate-x-1"
					}`}
				/>
			</div>
		</button>
	);
}

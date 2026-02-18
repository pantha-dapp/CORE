import { usePanthaContext } from "@pantha/react";
import {
	useLogout,
	useSelfFriends,
	useUserFollowers,
	useUserFollowing,
	useUserInfo,
} from "@pantha/react/hooks";
import { useLogout as usePrivyLogout } from "@privy-io/react-auth";
import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import type { JSX } from "react/jsx-runtime";
import Button from "../../shared/components/Button";

export default function Profile(): JSX.Element {
	const { logout: logoutPrivy } = usePrivyLogout();
	const router = useRouter();
	const [openSettings, setOpenSettings] = useState(false);
	const { mutateAsync: logoutPantha } = useLogout();
	const { wallet } = usePanthaContext();
	const walletAddress = wallet?.account.address;
	const { data: userInfo } = useUserInfo({ walletAddress });
	const { data: userFollowers } = useUserFollowers({
		walletAddress,
	});
	const { data: userFollowing } = useUserFollowing({
		walletAddress,
	});
	const { data: selfFriends } = useSelfFriends();

	console.log("User Info:", userInfo);
	console.log("User Followers:", userFollowers);
	console.log("User Following:", userFollowing);
	console.log("Self Friends:", selfFriends);
	return (
		<>
			<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8 pb-24">
				<div className="max-w-5xl mx-auto space-y-8">
					{/* ================= Profile Header ================= */}
					<div className="relative flex flex-col md:flex-row items-center gap-6 bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-6 rounded-2xl">
						{/* Settings Icon */}
						<Button
							onClick={() => setOpenSettings(true)}
							className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"
							aria-label="Settings"
						>
							⚙️
						</Button>

						{/* Avatar */}
						<div className="relative">
							<img
								src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userInfo?.user?.walletAddress ?? "abhishek"}`}
								alt="User avatar"
								className="w-28 h-28 rounded-full border-4 border-primary bg-background"
							/>
							<Button className="absolute bottom-0 right-0 bg-primary text-white text-xs px-2 py-1 rounded-lg">
								Edit
							</Button>
						</div>

						{/* User Info */}
						<div className="flex-1 text-center md:text-left">
							<h1 className="text-2xl font-bold">
								{userInfo?.user?.name ?? "Abhishek"}
							</h1>
							<p className="text-white/70">
								@{userInfo?.user?.username ?? "abhishek_ai"}
							</p>
							<p className="text-sm text-white/60 mt-1">
								Joined Jan 2026 • Learning every day 🚀
							</p>

							<div className="flex justify-center md:justify-start gap-6 mt-4">
								<Stat
									label="Followers"
									value={userFollowers?.followers.length ?? 0}
								/>
								<Stat
									label="Following"
									value={userFollowing?.following.length ?? 0}
								/>
								<Stat
									label="Friends"
									value={selfFriends?.friends.length ?? 0}
								/>
							</div>
						</div>

						<Button
							className="bg-secondary text-white px-4 py-2 rounded-xl font-semibold"
							onClick={() => router.navigate({ to: "/login", replace: true })}
						>
							+ Add Friends
						</Button>

						<Button
							className="bg-accent2 text-white px-4 py-2 rounded-xl font-semibold"
							onClick={async () => {
								console.log("Logging out...");
								await Promise.all([logoutPrivy(), logoutPantha()]);
								router.navigate({ to: "/login", replace: true });
							}}
						>
							Sign Out
						</Button>
					</div>

					{/* ================= Overview ================= */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<OverviewCard title="Day Streak 🔥" value="18 days" />
						<OverviewCard title="Total XP" value="12,450" />
						<OverviewCard title="Current League" value="Emerald" />
						<OverviewCard title="Daily Goal" value="Completed" />
					</div>

					{/* ================= Courses ================= */}
					<Section title="Courses">
						<CourseCard name="French" xp="8,200 XP" level="Intermediate" />
						<CourseCard name="Spanish" xp="2,900 XP" level="Beginner" />
						<CourseCard name="German" xp="1,350 XP" level="Beginner" />
					</Section>

					{/* ================= Friend Streaks ================= */}
					<Section title="Friend Streaks">
						<FriendStreak name="Rohit" days={12} />
						<FriendStreak name="Aman" days={7} />
						<FriendStreak name="Neha" days={21} />
					</Section>

					{/* ================= Achievements ================= */}
					<Section title="Achievements">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<Achievement title="Streak Starter" desc="7 day streak" />
							<Achievement title="XP Hunter" desc="10k XP earned" />
							<Achievement title="Consistent Learner" desc="30 lessons" />
							<Achievement title="Social Learner" desc="5 friends added" />
						</div>
					</Section>
				</div>
			</div>

			{/* ================= SETTINGS BOTTOM SHEET ================= */}
			{openSettings && (
				<div className="fixed inset-0 z-50 flex items-end bg-black/50">
					<div className="w-full max-h-[85vh] bg-linear-to-b from-gray-900 to-gray-800 rounded-t-3xl p-6 space-y-6 overflow-y-auto">
						{/* Header */}
						<div className="flex justify-between items-center">
							<h2 className="text-xl font-bold">Settings</h2>
							<Button
								onClick={() => setOpenSettings(false)}
								className="text-white/60 text-lg"
							>
								✕
							</Button>
						</div>

						<SettingsSection title="Account">
							<SettingsButton label="Edit Profile" />
							<SettingsButton label="Change Email" />
							<SettingsButton label="Change Password" />
						</SettingsSection>

						<SettingsSection title="Preferences">
							<SettingsButton label="Sound Effects" />
							<SettingsButton label="Notifications" />
							<SettingsButton label="Course Preferences" />
						</SettingsSection>

						<SettingsSection title="Privacy">
							<SettingsButton label="Profile Visibility" />
							<SettingsButton label="Blocked Users" />
						</SettingsSection>

						<SettingsSection title="Support">
							<SettingsButton label="Help Center" />
							<SettingsButton label="Send Feedback" />
						</SettingsSection>

						<Button
							onClick={async () => {
								await Promise.all([logoutPrivy(), logoutPantha()]);
								router.navigate({ to: "/login", replace: true });
							}}
							className="w-full bg-accent2 text-white py-3 rounded-xl font-semibold"
						>
							Sign Out
						</Button>
					</div>
				</div>
			)}
		</>
	);
}

/* ================= Components ================= */

interface StatProps {
	label: string;
	value: number;
}

function Stat({ label, value }: StatProps): JSX.Element {
	return (
		<div className="text-center">
			<p className="font-bold text-lg">{value}</p>
			<p className="text-sm text-white/60">{label}</p>
		</div>
	);
}

function OverviewCard({ title, value }: { title: string; value: string }) {
	return (
		<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-4 rounded-xl text-center">
			<p className="text-sm text-white/60">{title}</p>
			<p className="text-xl font-bold">{value}</p>
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="space-y-4">
			<h2 className="text-xl font-bold">{title}</h2>
			{children}
		</section>
	);
}

function CourseCard({
	name,
	xp,
	level,
}: {
	name: string;
	xp: string;
	level: string;
}) {
	return (
		<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-4 rounded-xl flex justify-between">
			<div>
				<p className="font-semibold">{name}</p>
				<p className="text-sm text-white/60">{level}</p>
			</div>
			<p className="font-bold text-primary">{xp}</p>
		</div>
	);
}

function FriendStreak({ name, days }: { name: string; days: number }) {
	return (
		<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-4 rounded-xl flex justify-between">
			<p>{name}</p>
			<p className="font-bold text-accent">{days} 🔥</p>
		</div>
	);
}

function Achievement({ title, desc }: { title: string; desc: string }) {
	return (
		<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-4 rounded-xl text-center">
			<p className="font-semibold">{title}</p>
			<p className="text-sm text-white/60">{desc}</p>
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
		<div className="space-y-2 text-white">
			<h3 className="text-lg font-semibold">{title}</h3>
			<div className="space-y-2">{children}</div>
		</div>
	);
}

function SettingsButton({ label }: { label: string }) {
	return (
		<Button className="w-full text-left bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl">
			{label}
		</Button>
	);
}

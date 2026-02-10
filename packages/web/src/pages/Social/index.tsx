import { useState } from "react";
import Button from "../../shared/components/Button";

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
		<Button
			onClick={onClick}
			className={`flex-1 py-3 rounded-full font-semibold transition ${
				active ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-300"
			}`}
		>
			{label}
		</Button>
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
			className={`bg-gray-800 rounded-3xl p-6 border border-gray-700/50 ${className}`}
		>
			{children}
		</div>
	);
}

export default function Social() {
	const [activeTab, setActiveTab] = useState<Tab>("feed");

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-4 pb-24">
			<div className="max-w-4xl mx-auto">
				<div className="h-20" />

				{/* Tabs */}
				<div className="bg-gray-800/50 rounded-full p-1.5 border border-gray-700/50 mb-6 flex gap-2">
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
						<SectionCard className="bg-linear-to-br from-yellow-900/50 to-orange-900/50 border-yellow-500/30">
							<div className="flex items-center gap-4 mb-4">
								<div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center text-3xl">
									🎉
								</div>
								<div className="flex-1">
									<h3 className="text-xl font-bold text-yellow-300">
										Celebrate with friends!
									</h3>
									<p className="text-sm text-yellow-100/70">
										Share your achievements and inspire others
									</p>
								</div>
							</div>
							<div className="flex gap-3">
								<Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900 py-3 rounded-xl font-semibold transition">
									Share Achievement
								</Button>
								<Button className="px-6 bg-gray-800/60 hover:bg-gray-700 text-yellow-300 py-3 rounded-xl font-semibold transition">
									View Friends
								</Button>
							</div>
						</SectionCard>

						{/* Daily Tips */}
						<SectionCard className="bg-linear-to-br from-blue-900/50 to-purple-900/50 border-blue-500/30">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl shrink-0">
									💡
								</div>
								<div className="flex-1">
									<h3 className="text-lg font-bold text-blue-300 mb-2">
										Today's Learning Tip
									</h3>
									<p className="text-white/80 text-sm mb-3">
										Practice consistently! Studies show that learning in short,
										daily sessions is more effective than cramming. Try to
										complete at least one chapter every day to maintain your
										streak.
									</p>
									<div className="flex items-center gap-2 text-xs text-blue-300">
										<span>📚</span>
										<span>Based on your progress</span>
									</div>
								</div>
							</div>
						</SectionCard>

						{/* Trending Now */}
						<SectionCard>
							<div className="flex items-center gap-3 mb-5">
								<span className="text-2xl">🔥</span>
								<h3 className="text-xl font-bold">Trending Now</h3>
							</div>
							<div className="space-y-3">
								{[
									{
										rank: 1,
										topic: "Advanced Neural Networks",
										learners: "2.3k learners this week",
										trend: "+45%",
										color: "from-red-500 to-orange-500",
									},
									{
										rank: 2,
										topic: "Blockchain Fundamentals",
										learners: "1.8k learners this week",
										trend: "+38%",
										color: "from-purple-500 to-pink-500",
									},
									{
										rank: 3,
										topic: "Python for Data Science",
										learners: "1.5k learners this week",
										trend: "+32%",
										color: "from-blue-500 to-cyan-500",
									},
								].map((item) => (
									<div
										key={item.topic}
										className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl hover:bg-gray-900 transition cursor-pointer"
									>
										<div className="flex items-center gap-4">
											<div className="text-2xl font-bold text-gray-600">
												#{item.rank}
											</div>
											<div>
												<h4 className="font-semibold">{item.topic}</h4>
												<p className="text-sm text-gray-400">{item.learners}</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-green-400 text-sm font-semibold">
												{item.trend}
											</span>
											<div
												className={`w-2 h-2 rounded-full bg-linear-to-r ${item.color}`}
											/>
										</div>
									</div>
								))}
							</div>
						</SectionCard>

						{/* Who's Learning What */}
						<SectionCard>
							<div className="flex items-center gap-3 mb-5">
								<span className="text-2xl">👥</span>
								<h3 className="text-xl font-bold">Who's Learning What</h3>
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
										color: "from-green-500 to-emerald-500",
									},
									{
										user: "Alex Kumar",
										avatar: "AK",
										action: "started learning",
										course: "Deep Learning Mastery",
										achievement: "Chapter 1 completed",
										time: "15 min ago",
										color: "from-blue-500 to-indigo-500",
									},
									{
										user: "Emma Rodriguez",
										avatar: "ER",
										action: "achieved a milestone in",
										course: "AI Ethics & Safety",
										achievement: "30 day streak! 🔥",
										time: "1 hour ago",
										color: "from-purple-500 to-pink-500",
									},
								].map((activity) => (
									<div
										key={`${activity.user}-${activity.course}`}
										className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-2xl hover:bg-gray-900 transition"
									>
										<div
											className={`w-12 h-12 rounded-full bg-linear-to-br ${activity.color} flex items-center justify-center font-bold text-sm shrink-0`}
										>
											{activity.avatar}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm mb-1">
												<span className="font-semibold">{activity.user}</span>
												<span className="text-gray-400">
													{" "}
													{activity.action}{" "}
												</span>
												<span className="font-semibold text-blue-400">
													{activity.course}
												</span>
											</p>
											<div className="flex items-center gap-3 text-xs">
												<span className="text-green-400">
													{activity.achievement}
												</span>
												<span className="text-gray-500">• {activity.time}</span>
											</div>
										</div>
										<Button className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition">
											Follow
										</Button>
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
						].map((chat) => (
							<div
								key={chat.user}
								className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50 hover:bg-gray-750 transition cursor-pointer"
							>
								<div className="flex items-center gap-4">
									<div className="relative shrink-0">
										<div className="w-14 h-14 rounded-full bg-linear-to-br from-green-500 to-blue-500 flex items-center justify-center font-bold">
											{chat.avatar}
										</div>
										{chat.online && (
											<div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1">
											<h3 className="font-semibold truncate">{chat.user}</h3>
											<span className="text-xs text-gray-500 shrink-0">
												{chat.time}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<p className="text-sm text-gray-400 truncate">
												{chat.lastMessage}
											</p>
											{chat.unread > 0 && (
												<span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shrink-0">
													{chat.unread}
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{activeTab === "friends" && (
					<div className="space-y-6">
						{/* Friend Requests */}
						<SectionCard>
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-3">
									<span className="text-2xl">👋</span>
									<h3 className="text-xl font-bold">Friend Requests</h3>
									<span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
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
										className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-2xl"
									>
										<div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold       shrink-0">
											{request.avatar}
										</div>
										<div className="flex-1 min-w-0">
											<h4 className="font-semibold">{request.user}</h4>
											<p className="text-sm text-gray-400 truncate">
												{request.info}
											</p>
											<p className="text-xs text-gray-500 mt-1">
												{request.time}
											</p>
										</div>
										<div className="flex gap-2 shrink-0">
											<Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition">
												Accept
											</Button>
											<Button className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-xl font-semibold text-sm transition">
												Decline
											</Button>
										</div>
									</div>
								))}
							</div>
						</SectionCard>

						{/* My Friends */}
						<SectionCard>
							<div className="flex items-center justify-between mb-5">
								<div className="flex items-center gap-3">
									<span className="text-2xl">👥</span>
									<h3 className="text-xl font-bold">My Friends</h3>
									<span className="text-sm text-gray-400">(24 friends)</span>
								</div>
								<Button className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition">
									See All
								</Button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{[
									{
										user: "Sarah Chen",
										avatar: "SC",
										status: "Currently learning: Neural Networks",
										streak: "15 day streak 🔥",
										online: true,
									},
									{
										user: "Alex Kumar",
										avatar: "AK",
										status: "Completed 8 courses this month",
										streak: "Top 10% learner 🏆",
										online: true,
									},
									{
										user: "Emma Rodriguez",
										avatar: "ER",
										status: "Studying AI Safety",
										streak: "30 day streak 🔥",
										online: false,
									},
									{
										user: "James Wilson",
										avatar: "JW",
										status: "Taking a break",
										streak: "Joined 3 months ago",
										online: false,
									},
								].map((friend) => (
									<div
										key={friend.user}
										className="p-4 bg-gray-900/50 rounded-2xl hover:bg-gray-900 transition"
									>
										<div className="flex items-center gap-3 mb-3">
											<div className="relative">
												<div className="w-12 h-12 rounded-full bg-linear-to-br from-green-500 to-blue-500 flex items-center justify-center font-bold">
													{friend.avatar}
												</div>
												{friend.online && (
													<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="font-semibold">{friend.user}</h4>
												<p className="text-xs text-gray-400">{friend.streak}</p>
											</div>
										</div>
										<p className="text-sm text-gray-400 mb-3 truncate">
											{friend.status}
										</p>
										<div className="flex gap-2">
											<Button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition">
												Message
											</Button>
											<Button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-xl text-sm font-semibold transition">
												View
											</Button>
										</div>
									</div>
								))}
							</div>
						</SectionCard>

						{/* Leaderboard */}
						<SectionCard className="bg-linear-to-br from-purple-900/50 to-blue-900/50 border-purple-500/30">
							<div className="flex items-center gap-3 mb-5">
								<span className="text-2xl">🏆</span>
								<h3 className="text-xl font-bold">Friends Leaderboard</h3>
							</div>
							<p className="text-sm text-white/70 mb-4">
								See how you rank among your friends this week
							</p>
							<div className="space-y-3">
								{[
									{
										rank: 1,
										user: "Emma Rodriguez",
										xp: "2,450 XP",
										color: "from-yellow-500 to-orange-500",
									},
									{
										rank: 2,
										user: "You",
										xp: "2,180 XP",
										color: "from-green-500 to-emerald-500",
									},
									{
										rank: 3,
										user: "Alex Kumar",
										xp: "1,920 XP",
										color: "from-blue-500 to-cyan-500",
									},
								].map((entry) => (
									<div
										key={entry.rank}
										className={`flex items-center gap-4 p-3 rounded-xl ${entry.user === "You" ? "bg-green-500/20 border border-green-500/30" : "bg-gray-800/50"}`}
									>
										<div className="text-2xl font-bold text-gray-600">
											#{entry.rank}
										</div>
										<div
											className={`w-10 h-10 rounded-full bg-linear-to-br ${entry.color} flex items-center justify-center font-bold text-sm`}
										>
											{entry.user.charAt(0)}
										</div>
										<div className="flex-1">
											<p className="font-semibold">{entry.user}</p>
											<p className="text-sm text-gray-400">{entry.xp}</p>
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

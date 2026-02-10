import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import Button from "./Button";
import Icon, { type IconName } from "./Icon";

interface NavItem {
	id: string;
	icon: IconName;
	label: string;
	path: string;
	color: string;
}

const navItems: NavItem[] = [
	{
		id: "home",
		icon: "house",
		label: "Home",
		path: "/",
		color: "#FF9600",
	},
	{
		id: "learn",
		icon: "graduation-cap",
		label: "Learn",
		path: "/dashboard",
		color: "#58CC02",
	},
	{
		id: "profile",
		icon: "user-circle",
		label: "Events",
		path: "/events",
		color: "#CE82FF",
	},
	{
		id: "chat",
		icon: "message-circle-heart",
		label: "Social",
		path: "/social",
		color: "#FF4B8B",
	},
	{
		id: "more",
		icon: "more-horizontal",
		label: "More",
		path: "/profile",
		color: "#1CB0F6",
	},
];

export default function Navigation() {
	const routerState = useRouterState();
	const router = useRouter();
	const currentPath = routerState.location.pathname;
	const [showMoreDrawer, setShowMoreDrawer] = useState(false);

	const handleMoreClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setShowMoreDrawer(!showMoreDrawer);
	};

	const handleDrawerOptionClick = (path: string) => {
		setShowMoreDrawer(false);
		router.navigate({ to: path });
	};

	return (
		<>
			<nav className="fixed bottom-0 left-0 right-0 bg-background border-t-4 border-[#2d3748] pb-safe z-50">
				<div className="max-w-5xl mx-auto px-2">
					<div className="flex items-center justify-around h-20">
						{navItems.map((item) => {
							const isActive = currentPath === item.path;
							const isMoreButton = item.id === "more";

							if (isMoreButton) {
								return (
									<Button
										key={item.id}
										onClick={handleMoreClick}
										className="relative flex flex-col items-center justify-center flex-1 h-full group"
									>
										{isActive && (
											<div
												className="absolute inset-x-2 inset-y-2 rounded-2xl opacity-20 motion-preset-expand"
												style={{ backgroundColor: item.color }}
											/>
										)}

										<div
											className={`relative z-10 mb-1 ${
												isActive
													? "motion-preset-bounce motion-scale-in-110 -translate-y-0.5"
													: ""
											}`}
										>
											<div
												className={`p-2 rounded-xl transition-all duration-200 ${
													isActive ? "shadow-lg" : ""
												}`}
												style={{
													backgroundColor: isActive
														? item.color
														: "transparent",
												}}
											>
												<Icon
													name={item.icon}
													size={24}
													className={`transition-colors duration-200 ${
														isActive ? "text-white" : "text-gray-400"
													}`}
												/>
											</div>
										</div>

										<span
											className={`text-xs font-bold transition-all duration-200 ${
												isActive
													? "text-white motion-scale-in-105"
													: "text-gray-500"
											}`}
											style={{
												color: isActive ? item.color : undefined,
											}}
										>
											{item.label}
										</span>

										<div
											className={`absolute inset-x-2 inset-y-2 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-200 ${
												!isActive ? "block" : "hidden"
											}`}
											style={{ backgroundColor: item.color }}
										/>
									</Button>
								);
							}

							return (
								<Link
									key={item.id}
									to={item.path}
									className="relative flex flex-col items-center justify-center flex-1 h-full group"
								>
									{isActive && (
										<div
											className="absolute inset-x-2 inset-y-2 rounded-2xl opacity-20 motion-preset-expand"
											style={{ backgroundColor: item.color }}
										/>
									)}

									<div
										className={`relative z-10 mb-1 ${
											isActive
												? "motion-preset-bounce motion-scale-in-110 -translate-y-0.5"
												: ""
										}`}
									>
										<div
											className={`p-2 rounded-xl transition-all duration-200 ${
												isActive ? "shadow-lg" : ""
											}`}
											style={{
												backgroundColor: isActive ? item.color : "transparent",
											}}
										>
											<Icon
												name={item.icon}
												size={24}
												className={`transition-colors duration-200 ${
													isActive ? "text-white" : "text-gray-400"
												}`}
											/>
										</div>
									</div>

									<span
										className={`text-xs font-bold transition-all duration-200 ${
											isActive
												? "text-white motion-scale-in-105"
												: "text-gray-500"
										}`}
										style={{
											color: isActive ? item.color : undefined,
										}}
									>
										{item.label}
									</span>

									<div
										className={`absolute inset-x-2 inset-y-2 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-200 ${
											!isActive ? "block" : "hidden"
										}`}
										style={{ backgroundColor: item.color }}
									/>
								</Link>
							);
						})}
					</div>
				</div>
			</nav>

			{/* More Options Drawer */}
			{showMoreDrawer && (
				<>
					{/* Backdrop */}
					<button
						type="button"
						className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 border-0 p-0 cursor-default"
						onClick={() => setShowMoreDrawer(false)}
						onKeyDown={(e) => {
							if (e.key === "Escape" || e.key === "Enter") {
								setShowMoreDrawer(false);
							}
						}}
						aria-label="Close drawer"
					/>
					<div className="fixed bottom-20 left-0 right-0 z-50 animate-slide-up">
						<div className="bg-linear-to-b from-gray-900 to-gray-800 px-4 py-3 border-t border-gray-700 shadow-2xl">
							{/* Handle Bar */}
							<div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-2" />

							<div className="space-y-2 max-w-5xl mx-auto">
								{/* Profile Option */}
								<Button
									onClick={() => handleDrawerOptionClick("/profile")}
									className="w-full flex items-center gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-700/50"
								>
									<div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
										<Icon
											name="user-circle"
											size={18}
											className="text-blue-400"
										/>
									</div>
									<div className="flex-1 text-left">
										<p className="text-sm font-semibold text-white">Profile</p>
										<p className="text-xs text-gray-400">View your profile</p>
									</div>
									<Icon
										name="chevron-right"
										size={16}
										className="text-gray-500"
									/>
								</Button>

								{/* Video Call Option */}
								<Button
									onClick={() => {
										setShowMoreDrawer(false);
										// Add video call functionality here
										console.log("Video call clicked");
									}}
									className="w-full flex items-center gap-3 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-700/50"
								>
									<div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
										<Icon name="video" size={18} className="text-green-400" />
									</div>
									<div className="flex-1 text-left">
										<p className="text-sm font-semibold text-white">
											Video Call
										</p>
										<p className="text-xs text-gray-400">
											Start a video session
										</p>
									</div>
									<Icon
										name="chevron-right"
										size={16}
										className="text-gray-500"
									/>
								</Button>
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
}

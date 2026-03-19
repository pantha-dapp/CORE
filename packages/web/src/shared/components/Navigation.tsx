import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import Icon, { type IconName } from "./Icon";

interface NavItem {
	id: string;
	icon: IconName;
	label: string;
	path: string;
}

const navItems: NavItem[] = [
	{ id: "home", icon: "house", label: "Home", path: "/dashboard" },
	{ id: "learn", icon: "graduation-cap", label: "Explore", path: "/explore" },
	{ id: "profile", icon: "user-circle", label: "Shop", path: "/shop" },
	{
		id: "chat",
		icon: "message-circle-heart",
		label: "Social",
		path: "/social",
	},
	{ id: "wallet", icon: "wallet", label: "Wallet", path: "/wallet" },
	{ id: "more", icon: "more-horizontal", label: "More", path: "/profile" },
];

export default function Navigation() {
	const routerState = useRouterState();
	const router = useRouter();
	const currentPath = routerState.location.pathname;
	const [showMoreDrawer, setShowMoreDrawer] = useState(false);

	const handleMoreClick = () => {
		setShowMoreDrawer(!showMoreDrawer);
	};

	const handleDrawerOptionClick = (path: string) => {
		setShowMoreDrawer(false);
		router.navigate({ to: path });
	};

	return (
		<>
			<nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-bg border-t-4 border-black dark:border-gray-600 font-tusker pb-safe">
				<div className="max-w-5xl mx-auto px-2">
					<div className="flex items-center justify-around h-16">
						{navItems.map((item) => {
							const isActive = currentPath === item.path;
							const isMoreButton = item.id === "more";

							if (isMoreButton) {
								return (
									<button
										key={item.id}
										type="button"
										onClick={handleMoreClick}
										className="relative flex flex-col items-center justify-center flex-1 h-full group"
									>
										<div
											className={`p-2 rounded-lg transition-all ${
												isActive
													? "bg-black dark:bg-dark-accent text-white dark:text-gray-900"
													: "hover:bg-gray-100 dark:hover:bg-dark-surface"
											}`}
										>
											<Icon
												name={item.icon}
												size={22}
												className={
													isActive
														? "text-white dark:text-gray-900"
														: "text-black dark:text-dark-text"
												}
											/>
										</div>
										<span
											className={`text-xs font-bold ${
												isActive
													? "text-black dark:text-dark-text"
													: "text-gray-500 dark:text-dark-muted"
											}`}
										>
											{item.label}
										</span>
									</button>
								);
							}

							return (
								<Link
									key={item.id}
									to={item.path}
									className="relative flex flex-col items-center justify-center flex-1 h-full group"
								>
									<div
										className={`p-2 rounded-lg transition-all ${
											isActive
												? "bg-black dark:bg-dark-accent text-white dark:text-gray-900"
												: "group-hover:bg-gray-100 dark:group-hover:bg-dark-surface"
										}`}
									>
										<Icon
											name={item.icon}
											size={22}
											className={
												isActive
													? "text-white dark:text-gray-900"
													: "text-black dark:text-dark-text"
											}
										/>
									</div>
									<span
										className={`text-xs font-bold ${
											isActive
												? "text-black dark:text-dark-text"
												: "text-gray-500 dark:text-dark-muted"
										}`}
									>
										{item.label}
									</span>
								</Link>
							);
						})}
					</div>
				</div>
			</nav>

			{/* More Options Drawer */}
			{showMoreDrawer && (
				<>
					<button
						type="button"
						className="fixed inset-0 bg-black/40 z-40"
						onClick={() => setShowMoreDrawer(false)}
						onKeyDown={(e) => {
							if (e.key === "Escape" || e.key === "Enter") {
								setShowMoreDrawer(false);
							}
						}}
						aria-label="Close drawer"
					/>
					<div className="fixed bottom-20 left-0 right-0 z-50 animate-slide-up">
						<div className="bg-white dark:bg-dark-card border-t-4 border-black dark:border-gray-600 px-4 py-3 shadow-lg">
							<div className="w-10 h-1 bg-gray-300 dark:bg-gray-500 rounded-full mx-auto mb-3" />

							<div className="space-y-2 max-w-5xl mx-auto">
								<button
									type="button"
									onClick={() => handleDrawerOptionClick("/profile")}
									className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-black dark:hover:border-dark-accent hover:bg-gray-50 dark:hover:bg-dark-surface transition-all text-left font-montserrat"
								>
									<div className="w-9 h-9 bg-landing-button-primary/20 dark:bg-gray-600 rounded-lg flex items-center justify-center shrink-0">
										<Icon
											name="user-circle"
											size={18}
											className="text-landing-button-primary dark:text-gray-200"
										/>
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-gray-900 dark:text-dark-text">
											Profile
										</p>
										<p className="text-xs text-gray-500 dark:text-dark-muted">
											View your profile
										</p>
									</div>
									<Icon
										name="chevron-right"
										size={16}
										className="text-gray-400 dark:text-gray-500"
									/>
								</button>
								<button
									type="button"
									onClick={() => {
										setShowMoreDrawer(false);
										console.log("Video call clicked");
									}}
									className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-black dark:hover:border-dark-accent hover:bg-gray-50 dark:hover:bg-dark-surface transition-all text-left font-montserrat"
								>
									<div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
										<Icon name="video" size={18} className="text-green-600" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-gray-900 dark:text-dark-text">
											Video Call
										</p>
										<p className="text-xs text-gray-500 dark:text-dark-muted">
											Start a video session
										</p>
									</div>
									<Icon
										name="chevron-right"
										size={16}
										className="text-gray-400 dark:text-gray-500"
									/>
								</button>
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
}

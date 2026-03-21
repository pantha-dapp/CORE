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
			<nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-card border-t border-dark-border/50 pb-safe w-full font-titillium">
				<div className="w-full max-w-lg mx-auto px-2">
					<div className="flex items-center justify-evenly w-full h-16">
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
											className={`p-2 rounded-xl transition-all ${
												isActive
													? "bg-dark-surface text-dark-accent"
													: "hover:bg-dark-surface/60 text-dark-muted"
											}`}
										>
											<Icon
												name={item.icon}
												size={22}
												className={
													isActive ? "text-dark-accent" : "text-dark-muted"
												}
											/>
										</div>
										<span
											className={`text-[10px] font-semibold uppercase tracking-wider ${
												isActive ? "text-dark-text" : "text-dark-muted"
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
									className={`p-1.5 flex-1 rounded-xl transition-all relative flex flex-col items-center justify-center group ${
										isActive ? "bg-dark-surface" : "hover:bg-dark-surface/40"
									}`}
								>
									<div>
										<Icon
											name={item.icon}
											size={22}
											className={
												isActive ? "text-dark-accent" : "text-dark-muted"
											}
										/>
									</div>
									<span
										className={`text-[10px] font-semibold uppercase tracking-wider ${
											isActive ? "text-dark-text" : "text-dark-muted"
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
						<div className="bg-dark-surface border border-dark-border px-4 py-3 shadow-xl font-titillium">
							<div className="w-10 h-1 bg-dark-border rounded-full mx-auto mb-3" />

							<div className="space-y-2 max-w-5xl mx-auto">
								<button
									type="button"
									onClick={() => handleDrawerOptionClick("/profile")}
									className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-dark-bg transition-all text-left"
								>
									<div className="w-9 h-9 bg-dark-accent-muted rounded-lg flex items-center justify-center shrink-0">
										<Icon
											name="user-circle"
											size={18}
											className="text-dark-accent"
										/>
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-dark-text">
											Profile
										</p>
										<p className="text-xs text-dark-muted">View your profile</p>
									</div>
									<Icon
										name="chevron-right"
										size={16}
										className="text-dark-muted"
									/>
								</button>
								<button
									type="button"
									onClick={() => {
										setShowMoreDrawer(false);
										console.log("Video call clicked");
									}}
									className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-dark-bg transition-all text-left"
								>
									<div className="w-9 h-9 bg-dark-success/20 rounded-lg flex items-center justify-center shrink-0">
										<Icon
											name="video"
											size={18}
											className="text-dark-success"
										/>
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-dark-text">
											Video Call
										</p>
										<p className="text-xs text-dark-muted">
											Start a video session
										</p>
									</div>
									<Icon
										name="chevron-right"
										size={16}
										className="text-dark-muted"
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

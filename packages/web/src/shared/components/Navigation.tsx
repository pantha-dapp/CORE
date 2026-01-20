import { Link, useRouterState } from "@tanstack/react-router";
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
		label: "Profile",
		path: "/profile",
		color: "#CE82FF",
	},
	{
		id: "chat",
		icon: "message-circle-heart",
		label: "Messages",
		path: "/messages",
		color: "#FF4B8B",
	},
	{
		id: "more",
		icon: "more-horizontal",
		label: "More",
		path: "/more",
		color: "#1CB0F6",
	},
];

export default function Navigation() {
	const router = useRouterState();
	const currentPath = router.location.pathname;

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-[#1f2937] border-t-4 border-[#2d3748] pb-safe z-50">
			<div className="max-w-5xl mx-auto px-2">
				<div className="flex items-center justify-around h-20">
					{navItems.map((item) => {
						const isActive = currentPath === item.path;

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
	);
}

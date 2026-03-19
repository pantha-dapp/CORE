import { usePanthaContext } from "@pantha/react";
import { useIsLoggedIn } from "@pantha/react/hooks";
import { usePrivy } from "@privy-io/react-auth";
import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import Navigation from "../shared/components/Navigation";
import { withPageErrorBoundary } from "../shared/components/PageErrorBoundary";
import ChapterDetails from "./ChapterDetails";
import Dashboard from "./Dashboard";
import ExplorePage from "./Explore";
import IndexPage from "./IndexPage";
import LoginPage from "./LoginPage";
import Onboarding from "./Onboarding";
import Profile from "./Profile";
import Shop from "./Shop";
import Social from "./Social";
import Test from "./Test";
import Wallet from "./Wallet";

type ProtectedRouteType = "loggedOutOnly" | "loggedInOnly";
interface ProtectedRouteProps {
	type: ProtectedRouteType;
	children: React.ReactNode;
}

function ProtectedRoute({ type, children }: ProtectedRouteProps) {
	const { ready, authenticated } = usePrivy();
	const { ready: panthaReady } = usePanthaContext();
	const router = useRouter();
	const { data: isLoggedIn, isLoading: isLoggedInLoading } = useIsLoggedIn();
	const [protectionLogicExecuted, setProtectionLogicExecuted] = useState(false);

	useEffect(() => {
		if (ready && !isLoggedInLoading) {
			if (type === "loggedOutOnly") {
				if (isLoggedIn === true) {
					router.navigate({ to: "/dashboard", replace: true });
				} else if (isLoggedIn === false) {
					if (authenticated === false) {
						setProtectionLogicExecuted(true);
					}
				}
			}

			if (type === "loggedInOnly") {
				if (isLoggedIn === true) {
					setProtectionLogicExecuted(true);
				} else if (isLoggedIn === false) {
					if (authenticated === false) {
						router.navigate({ to: "/login", replace: true });
					}
				}
			}
		}
	}, [isLoggedIn, isLoggedInLoading, ready, authenticated, router, type]);

	if (!ready && !panthaReady && !protectionLogicExecuted) {
		return <div>Loading...</div>;
	}

	return <>{children}</>;
}

const rootRoute = createRootRoute({
	component: () => <Outlet />,
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: function Index() {
		return withPageErrorBoundary(IndexPage)({});
	},
});

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/login",
	component: function Login() {
		return (
			<ProtectedRoute type="loggedOutOnly">
				{withPageErrorBoundary(LoginPage)({})}
			</ProtectedRoute>
		);
	},
});

const onboardingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/onboarding",
	component: function OnboardingRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<Onboarding />
				<Navigation />
			</ProtectedRoute>
		);
	},
});

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/dashboard",
	component: function DashboardRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<Dashboard />
				<Navigation />
			</ProtectedRoute>
		);
	},
});

const exploreRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/explore",
	component: function ExploreRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<ExplorePage />
				<Navigation />
			</ProtectedRoute>
		);
	},
});

const shopRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/shop",
	component: function ShopRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<Shop />
				<Navigation />
			</ProtectedRoute>
		);
	},
});

const ChapterDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/course/$courseId/chapter/$chapterId",
	component: function ChapterDetailRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<ChapterDetails />
			</ProtectedRoute>
		);
	},
});

const profileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/profile",
	component: function ProfileRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<Profile />
				<Navigation />
			</ProtectedRoute>
		);
	},
});

const socialRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/social",
	component: function SocialRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<Social />
				<Navigation />
			</ProtectedRoute>
		);
	},
});

const testRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/test",
	component: function TestRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<Test />
				<Navigation />
			</ProtectedRoute>
		);
	},
});

const walletRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/wallet",
	component: function WalletRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<Wallet />
				<Navigation />
			</ProtectedRoute>
		);
	},
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	onboardingRoute,
	dashboardRoute,
	ChapterDetailRoute,
	socialRoute,
	profileRoute,
	testRoute,
	exploreRoute,
	shopRoute,
	walletRoute,
]);

const router = createRouter({
	routeTree,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

export default router;

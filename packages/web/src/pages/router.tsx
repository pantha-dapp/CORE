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
import Chapters from "./Chapters";
import Dashboard from "./Dashboard";
import Events from "./Events";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import Onboarding from "./Onboarding";
import Profile from "./Profile";
import Social from "./Social";
import Test from "./Test";

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
		return withPageErrorBoundary(LandingPage)({});
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

const ChaptersRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/chapters/$courseId",
	component: function ChaptersRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				{/* Add your Courses component here */}
				<Chapters />
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
				{/* Add your ChapterDetail component here */}
				<ChapterDetails />
				<Navigation />
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

const eventsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/events",
	component: function EventsRoute() {
		return (
			<ProtectedRoute type="loggedInOnly">
				<Events />
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

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	onboardingRoute,
	dashboardRoute,
	ChaptersRoute,
	ChapterDetailRoute,
	eventsRoute,
	socialRoute,
	profileRoute,
	testRoute,
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

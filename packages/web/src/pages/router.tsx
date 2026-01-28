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
import Dashboard from "./Dashboard";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import Onboarding from "./Onboarding";
import Profile from "./Profile";
import Test from "./Test";

type ProtectedRouteType = "loggedOutOnly" | "loggedInOnly";
interface ProtectedRouteProps {
	type: ProtectedRouteType;
	children: React.ReactNode;
}

function ProtectedRoute({ type, children }: ProtectedRouteProps) {
	const { ready, authenticated } = usePrivy();
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

	if (!ready && !protectionLogicExecuted) {
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

// const courseMapRoute = createRoute({
// 	getParentRoute: () => rootRoute,
// 	path: "/course-map",
// 	component: function CourseMapRoute() {
// 		return (
// 			<ProtectedRoute type="loggedInOnly">
// 				<CourseMap />
// 				<Navigation />
// 			</ProtectedRoute>
// 		);
// 	},
// });
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

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	onboardingRoute,
	dashboardRoute,
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

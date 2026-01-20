import { useIsLoggedIn } from "@pantha/react/hooks";
import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import type React from "react";
import Navigation from "../shared/components/Navigation";
import { withPageErrorBoundary } from "../shared/components/PageErrorBoundary";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import Onboarding from "./Onboarding";
import Dashboard from "./Profile";

type ProtectedRouteType = "loggedOutOnly" | "loggedInOnly";

interface ProtectedRouteProps {
	type: ProtectedRouteType;
	children: React.ReactNode;
}

function ProtectedRoute({ type, children }: ProtectedRouteProps) {
	const { data: isLoggedIn, isLoading } = useIsLoggedIn();
	const router = useRouter();

	if (isLoading) {
		return <div>Loading...</div>; // Or some loading component
	}

	if (type === "loggedOutOnly" && isLoggedIn) {
		router.navigate({ to: "/dashboard", replace: true });
		return null;
	}

	if (type === "loggedInOnly" && !isLoggedIn) {
		router.navigate({ to: "/login", replace: true });
		return null;
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

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	onboardingRoute,
	dashboardRoute,
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

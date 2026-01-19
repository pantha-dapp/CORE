import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
} from "@tanstack/react-router";
import { withPageErrorBoundary } from "../shared/components/PageErrorBoundary";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import Onboarding from "./Onboarding/Onboarding";
import Dashboard from "./Profile/dashboard";

const rootRoute = createRootRoute({
	component: () => {
		// useAnalytics();

		return <Outlet />;
	},
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
		return withPageErrorBoundary(LoginPage)({});
	},
});

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/dashboard",
	component: Dashboard,
});

const onboardingRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/onboarding",
	component: Onboarding,
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	dashboardRoute,
	onboardingRoute,
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

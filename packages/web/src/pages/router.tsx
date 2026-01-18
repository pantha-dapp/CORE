import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
} from "@tanstack/react-router";
import { withPageErrorBoundary } from "../shared/components/PageErrorBoundary";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";

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

const routeTree = rootRoute.addChildren([indexRoute, loginRoute]);
const router = createRouter({
	routeTree,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

export default router;

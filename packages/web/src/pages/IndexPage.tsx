import { useIsLoggedIn } from "@pantha/react/hooks";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import LandingPage from "./LandingPage";

/**
 * Landing page at /. Only shown when logged out.
 * Logged-in users are redirected to /onboarding.
 */
export default function IndexPage() {
	const { ready, authenticated } = usePrivy();
	const { data: isLoggedIn, isLoading: isLoggedInLoading } = useIsLoggedIn();
	const router = useRouter();

	useEffect(() => {
		if (!ready || isLoggedInLoading) return;
		if (isLoggedIn === true) {
			router.navigate({ to: "/onboarding", replace: true });
		}
	}, [ready, isLoggedInLoading, isLoggedIn, router]);

	// Logged out: show Landing
	if (authenticated === false) {
		return <LandingPage />;
	}

	// Still loading auth state
	if (!ready || isLoggedInLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-landing-hero-bg">
				<div className="w-10 h-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
			</div>
		);
	}

	// Logged in (Privy) but Pantha login not complete - show loading
	if (authenticated && isLoggedIn === false) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-landing-hero-bg">
				<div className="w-10 h-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
			</div>
		);
	}

	// Logged in: redirecting to onboarding
	return (
		<div className="min-h-screen flex items-center justify-center bg-landing-hero-bg">
			<div className="w-10 h-10 rounded-full border-4 border-white border-t-transparent animate-spin" />
		</div>
	);
}

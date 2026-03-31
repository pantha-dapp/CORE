import { useEvent } from "@pantha/react";
import { useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Listens for friend-streak:extended SSE events and shows a toast notification.
 * Suppressed while the user is inside a chapter session (/course/.../chapter/...)
 * so gameplay is never interrupted.
 */
export function useFriendStreakToasts() {
	const location = useLocation();

	// Keep a ref so the stable handler closure always reads the latest path.
	const pathnameRef = useRef(location.pathname);
	useEffect(() => {
		pathnameRef.current = location.pathname;
	}, [location.pathname]);

	const handler = useCallback(
		(payload: { friendWallet: string; currentStreak: number }) => {
			// Don't interrupt chapter gameplay
			if (pathnameRef.current.includes("/chapter/")) return;

			const short = `${payload.friendWallet.slice(0, 6)}...${payload.friendWallet.slice(-4)}`;
			toast(
				`🔥 You & ${short} now have a ${payload.currentStreak}-day friend streak!`,
				{
					duration: 6000,
				},
			);
		},
		[],
	);

	useEvent("friend-streak:extended", handler);
}

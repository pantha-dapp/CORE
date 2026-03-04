import { HOUR } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

/**
 * Fetches the full profile of a friend (mutual follow).
 * The server enforces the mutual-follow check — a 401 is thrown
 * if the two users are not mutual friends.
 */
export function useFriendProfileView(args: { walletAddress?: Address }) {
	const { walletAddress } = args;
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["friendProfile", walletAddress],
		queryFn: async () => {
			if (!wallet || !api.jwtExists || !walletAddress) {
				throw new Error("not connected");
			}

			const raw = await api.rpc.users[":wallet"].profile.$get({
				param: { wallet: walletAddress },
			});
			const res = await raw.json();

			if (!res.success) {
				throw new Error("Failed to fetch friend profile");
			}

			return res.data;
		},
		staleTime: 1 * HOUR,
		enabled: !!wallet?.account.address && !!walletAddress,
	});
}

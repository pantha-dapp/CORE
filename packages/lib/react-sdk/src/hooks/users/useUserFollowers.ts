import { HOUR } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUserFollowers(args: { walletAddress?: Address }) {
	const { walletAddress } = args;
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["followersOfUser", walletAddress],
		queryFn: async () => {
			if (!wallet || !api.jwtExists || !walletAddress) {
				throw new Error("not connected");
			}

			const followersResponseRaw = await api.rpc.users[
				":wallet"
			].followers.$get({ param: { wallet: walletAddress } });
			const followersResponse = await followersResponseRaw.json();

			if (!followersResponse.success) {
				throw new Error("Failed to retrieve followers data");
			}

			return followersResponse.data;
		},
		staleTime: 1 * HOUR,
		enabled: !!walletAddress,
	});
}

import { HOUR } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUserFollowing(args: { walletAddress?: Address }) {
	const { walletAddress } = args;
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["followingOfUser", walletAddress],
		queryFn: async () => {
			if (!wallet || !api.jwtExists || !walletAddress) {
				throw new Error("not connected");
			}

			const followingResponseRaw = await api.rpc.users[
				":wallet"
			].following.$get({ param: { wallet: walletAddress } });
			const followingResponse = await followingResponseRaw.json();

			if (!followingResponse.success) {
				throw new Error("Failed to retrieve following data");
			}

			return followingResponse.data;
		},
		staleTime: 1 * HOUR,
		enabled: !!walletAddress,
	});
}

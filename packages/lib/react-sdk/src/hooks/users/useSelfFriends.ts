import { HOUR } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useSelfFriends() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["friendsOfUser", wallet?.account.address],
		queryFn: async () => {
			if (!wallet || !api.jwtExists || !wallet.account.address) {
				throw new Error("not connected");
			}

			const friendsResponseRaw = await api.rpc.users[":wallet"].friends.$get({
				param: {
					wallet: wallet.account.address,
				},
			});
			const friendsResponse = await friendsResponseRaw.json();

			if (!friendsResponse.success) {
				throw new Error("Failed to retrieve friends data");
			}

			return friendsResponse.data;
		},
		staleTime: 1 * HOUR,
		enabled: !!wallet?.account.address,
	});
}

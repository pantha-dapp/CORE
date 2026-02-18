import { useMutation } from "@tanstack/react-query";
import type { Address } from "viem/accounts";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUnfollowUser() {
	const { wallet, api } = usePanthaContext();

	return useMutation({
		mutationFn: async (args: { walletToUnfollow: Address }) => {
			const { walletToUnfollow } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const unfollowResponseRaw = await api.rpc.users.unfollow.$post({
				json: {
					walletToUnfollow,
				},
			});
			const unfollowResponse = await unfollowResponseRaw.json();

			return unfollowResponse.success;
		},
	});
}

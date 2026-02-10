import { useMutation } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useFollowUser() {
	const { wallet, api } = usePanthaContext();

	return useMutation({
		mutationFn: async (args: { walletToFollow: string }) => {
			const { walletToFollow } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const followResponseRaw = await api.rpc.users.follow.$post({
				json: {
					walletToFollow,
				},
			});
			const followResponse = await followResponseRaw.json();

			return followResponse.success;
		},
	});
}

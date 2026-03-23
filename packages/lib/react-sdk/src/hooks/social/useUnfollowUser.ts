import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem/accounts";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUnfollowUser() {
	const { wallet, api } = usePanthaContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (args: { walletToUnfollow: Address }) => {
			const { walletToUnfollow } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const unfollowResponseRaw = await api.rpc.users.unfollow.$post({
				json: { walletToUnfollow },
			});
			const unfollowResponse = await unfollowResponseRaw.json();

			return unfollowResponse.success;
		},
		onMutate: async ({ walletToUnfollow }) => {
			const qk = ["userFollowing", wallet?.account.address];
			await queryClient.cancelQueries({ queryKey: qk });
			const prev = queryClient.getQueryData(qk);
			queryClient.setQueryData(qk, (old: unknown) => {
				const o = old as { following?: string[] } | undefined;
				if (!o?.following) return old;
				return { following: o.following.filter((a) => a !== walletToUnfollow) };
			});
			return { prev };
		},
		onError: (_err, _vars, context) => {
			const ctx = context as { prev?: unknown } | undefined;
			if (ctx?.prev !== undefined) {
				queryClient.setQueryData(
					["userFollowing", wallet?.account.address],
					ctx.prev,
				);
			}
		},
		onSuccess: (_data, { walletToUnfollow }) => {
			queryClient.invalidateQueries({ queryKey: ["userFollowing"] });
			queryClient.invalidateQueries({ queryKey: ["userFollowers"] });
			queryClient.invalidateQueries({ queryKey: ["friendsOfUser"] });
			queryClient.invalidateQueries({
				queryKey: ["friendProfile", walletToUnfollow],
			});
		},
	});
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useFollowUser() {
	const { wallet, api } = usePanthaContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (args: { walletToFollow: Address }) => {
			const { walletToFollow } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const followResponseRaw = await api.rpc.users.follow.$post({
				json: { walletToFollow },
			});
			const followResponse = await followResponseRaw.json();

			return followResponse.success;
		},
		onMutate: async ({ walletToFollow }) => {
			const qk = ["userFollowing", wallet?.account.address];
			await queryClient.cancelQueries({ queryKey: qk });
			const prev = queryClient.getQueryData(qk);
			queryClient.setQueryData(qk, (old: unknown) => {
				const o = old as { following?: string[] } | undefined;
				if (!o?.following) return old;
				return { following: [...o.following, walletToFollow] };
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
		onSuccess: (_data, { walletToFollow }) => {
			queryClient.invalidateQueries({ queryKey: ["userFollowing"] });
			queryClient.invalidateQueries({ queryKey: ["userFollowers"] });
			queryClient.invalidateQueries({ queryKey: ["friendsOfUser"] });
			queryClient.invalidateQueries({
				queryKey: ["friendProfile", walletToFollow],
			});
		},
	});
}

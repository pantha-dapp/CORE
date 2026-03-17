import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

export function usePanthaTokenFaucet() {
	const { wallet, api, contracts } = usePanthaContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["panthaTokenFaucet", wallet?.account.address],
		mutationFn: async () => {
			if (!wallet) throw new Error("not connected");

			const address = wallet.account.address as Address;

			const raw = await api.rpc.faucet.pantha.$post({
				query: { address },
			});
			const res = await raw.json();

			if (!res.success) throw new Error("Faucet request failed");

			if (res.data.claimed) {
				await contracts.$publicClient.waitForTransactionReceipt({
					hash: res.data.txHash,
				});
				await queryClient.invalidateQueries({
					queryKey: ["panthaTokenBalance", address],
				});
				await queryClient.refetchQueries({
					queryKey: ["panthaTokenBalance", address],
				});

				return res.data;
			} else {
				return res.data;
			}
		},
	});
}

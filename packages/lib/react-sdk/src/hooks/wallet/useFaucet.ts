import { useMutation } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useFaucet() {
	const { wallet, api } = usePanthaContext();

	return useMutation({
		mutationFn: async () => {
			if (!wallet) throw new Error("not connected");

			const address = wallet.account.address as Address;

			const raw = await api.rpc.faucet.pantha.$post({
				query: { address },
			});
			const res = await raw.json();

			if (!res.success) throw new Error("Faucet request failed");

			return res.data;
		},
	});
}

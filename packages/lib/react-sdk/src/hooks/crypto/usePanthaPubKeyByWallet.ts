import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

export function usePanthaPubKeyByWallet(args: { walletAddress?: Address }) {
	const { wallet, contracts } = usePanthaContext();

	const enabled = !!wallet && !!contracts && !!args.walletAddress;

	return useQuery({
		queryKey: ["pubKey", contracts?.PanthaKeyStore.address, args.walletAddress],
		queryFn: async () => {
			if (!contracts || !wallet || !args.walletAddress) {
				throw new Error("Contracts or wallet not available");
			}
			const isRegistered = await contracts.PanthaKeyStore.read.isRegistered([
				args.walletAddress,
			]);

			if (!isRegistered) {
				return { registered: false };
			}

			const keygenData = await contracts.PanthaKeyStore.read.keygenData([
				args.walletAddress,
			]);

			const publicKey = keygenData[2];
			return {
				registered: true,
				publicKey,
			};
		},
		enabled,
	});
}

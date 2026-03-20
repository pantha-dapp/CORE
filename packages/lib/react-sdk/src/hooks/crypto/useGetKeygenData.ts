import { walletKeyGen } from "@pantha/contracts";
import { useQuery } from "@tanstack/react-query";
import { toHex } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useGetKeygenData() {
	const { wallet, contracts } = usePanthaContext();

	const enabled = !!wallet && !!contracts;

	return useQuery({
		queryKey: [
			"keygenData",
			contracts?.PanthaKeyStore.address,
			wallet?.account.address,
		],
		queryFn: async () => {
			if (!contracts || !wallet) {
				throw new Error("Contracts or wallet not available");
			}
			const isRegistered = await contracts.PanthaKeyStore.read.isRegistered([
				wallet.account.address,
			]);

			if (!isRegistered) {
				return { registered: false };
			}

			const keygenData = await contracts.PanthaKeyStore.read.keygenData([
				wallet.account.address,
			]);

			//@ts-expect-error - types are wrong
			const keygen = await walletKeyGen(wallet, {
				salts: {
					challenge: keygenData[0],
					seed: keygenData[1],
				},
			});

			if (toHex(keygen.account.publicKey) !== keygenData[2]) {
				throw new Error("Public key mismatch");
			}

			return {
				registered: true,
				keygen: keygen,
			};
		},
		enabled,
	});
}

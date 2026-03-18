import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function usePanthaTokenBalance() {
	const { contracts, wallet } = usePanthaContext();

	return useQuery({
		queryKey: ["panthaTokenBalance", wallet?.account.address],
		queryFn: async () => {
			if (!contracts || !wallet) throw new Error("not connected");

			// const balance = await contracts.$publicClient.readContract({
			// 	abi: contracts.PanthaToken.abi,
			// 	address: contracts.PanthaToken.address,
			// 	functionName: "balanceOf",
			// 	args: [wallet.account.address],
			// });

			const balance = await contracts.PanthaToken.read.balanceOf([
				wallet.account.address,
			]);
			const decimals = await contracts.PanthaToken.read.decimals();

			const humanReadableBalance = Number(balance) / 10 ** decimals;

			return { balanceBps: balance, balanceHuman: humanReadableBalance };
		},
	});
}

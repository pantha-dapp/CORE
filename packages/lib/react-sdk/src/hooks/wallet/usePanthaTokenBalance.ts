import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";
import { usePanthaTokenDecimals } from ".";

export function usePanthaTokenBalance() {
	const { contracts, wallet } = usePanthaContext();
	const { data: decimals } = usePanthaTokenDecimals();

	return useQuery({
		queryKey: ["panthaTokenBalance", wallet?.account.address],
		queryFn: async () => {
			if (!contracts || !wallet) throw new Error("not connected");
			if (!decimals) throw new Error("decimals not loaded");

			const balance = await contracts.PanthaToken.read.balanceOf([
				wallet.account.address,
			]);
			const humanReadableBalance = Number(balance) / 10 ** decimals;

			return { balanceBps: balance, balanceHuman: humanReadableBalance };
		},
		enabled: !!contracts && !!wallet && decimals !== undefined,
	});
}

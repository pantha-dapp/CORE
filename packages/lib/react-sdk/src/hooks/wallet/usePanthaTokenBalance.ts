import { useMutation } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function usePanthaTokenBalance() {
	const { contracts, wallet } = usePanthaContext();

	return useMutation({
		mutationFn: async () => {
			if (!contracts || !wallet) throw new Error("not connected");

			const balance = await contracts.PanthaToken.read.balanceOf([
				wallet.account.address,
			]);

			return balance;
		},
	});
}

import { MINUTE } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function usePanthaTokenDecimals() {
	const { contracts, wallet } = usePanthaContext();

	return useQuery({
		queryKey: ["panthaTokenDecimals"],
		queryFn: async () => {
			if (!contracts || !wallet) throw new Error("not connected");

			const decimals = await contracts.PanthaToken.read.decimals();

			return decimals;
		},
		staleTime: 30 * MINUTE,
	});
}

import { useQuery } from "@tanstack/react-query";
import { DAY } from "../../../../../server/constants";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useIsLoggedIn() {
	const { wallet } = usePanthaContext();

	return useQuery({
		queryKey: ["is-logged-in", wallet?.account.address],
		queryFn: async () => {
			if (!wallet) return false;

			return true;
		},
		staleTime: 1 * DAY,
		enabled: !!wallet,
	});
}

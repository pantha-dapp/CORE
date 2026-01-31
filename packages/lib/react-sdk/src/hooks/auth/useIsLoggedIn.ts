import { DAY } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

// const storage = idb({ db: "pantha", store: "auth" });

export function useIsLoggedIn() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["is-logged-in", wallet?.account.address],
		queryFn: async () => {
			if (!wallet) return false;

			return api.jwtExists;
		},
		staleTime: 1 * DAY,
	});
}

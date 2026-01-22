import { DAY } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";
import { idb } from "../../utils/idb";

const storage = idb({ db: "pantha", store: "auth" });

export function useIsLoggedIn() {
	const { wallet } = usePanthaContext();

	return useQuery({
		queryKey: ["is-logged-in", wallet?.account.address],
		queryFn: async () => {
			if (!wallet) return false;

			const jwt = await storage.get("jwt");
			return !!jwt;
		},
		staleTime: 1 * DAY,
	});
}

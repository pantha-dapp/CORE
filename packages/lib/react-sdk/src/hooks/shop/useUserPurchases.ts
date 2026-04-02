import { MINUTE } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUserPurchases() {
	const { api, wallet } = usePanthaContext();
	const enabled = !!wallet && !!api.jwtExists;

	return useQuery({
		queryKey: ["userPurchases", wallet?.account.address],
		queryFn: async () => {
			if (!enabled) {
				throw new Error("not connected");
			}

			const response = await parseResponse(api.rpc.shop.purchases.$get());

			return response.data;
		},
		staleTime: 20 * MINUTE,
		enabled,
	});
}

import { MINUTE } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useShopItems() {
	const { api, wallet } = usePanthaContext();
	const enabled = !!wallet && !!api.jwtExists;

	return useQuery({
		queryKey: ["shopItems"],
		queryFn: async () => {
			if (!enabled) {
				throw new Error("not connected");
			}

			const response = await parseResponse(api.rpc.shop.$get());

			return response.data;
		},
		staleTime: 20 * MINUTE,
		enabled,
	});
}

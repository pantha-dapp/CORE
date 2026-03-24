import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useSelfActionHash() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["actionHashOfUser", wallet?.account.address],
		queryFn: async () => {
			if (!wallet || !api.jwtExists || !wallet.account.address) {
				throw new Error("not connected");
			}

			const hashResponse = await parseResponse(
				api.rpc.users[":wallet"]["action-hash"].$get({
					param: {
						wallet: wallet.account.address,
					},
				}),
			);

			if (!hashResponse.success) {
				throw new Error("Failed to retrieve friends data");
			}

			return hashResponse.data;
		},
		enabled: !!wallet?.account.address,
	});
}

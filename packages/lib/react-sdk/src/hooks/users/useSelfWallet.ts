import { DAY } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useSelfWallet() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["selfWallet", wallet?.account.address],
		queryFn: async () => {
			if (!wallet || !api.jwtExists) {
				throw new Error("not connected");
			}

			const selfResponseRaw = await api.rpc.users.me.$get();
			const selfResponse = await selfResponseRaw.json();

			if (!selfResponse.success) {
				throw new Error("Failed to retrieve self wallet");
			}

			return selfResponse.data;
		},
		staleTime: 7 * DAY,
		enabled: !!wallet?.account.address,
	});
}

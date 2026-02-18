import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useSearchUsers(args: { query: string }) {
	const { query } = args;
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["searchUsers", query],
		queryFn: async () => {
			if (!wallet || !api.jwtExists) {
				throw new Error("not connected");
			}
			const searchResponseRaw = await api.rpc.users.search.$get({
				query: { q: query },
			});
			const searchResponse = await searchResponseRaw.json();
			if (!searchResponse.success) {
				throw new Error("Failed to search users");
			}
			return searchResponse.data;
		},
		enabled: !!wallet?.account.address && query.length > 0,
	});
}

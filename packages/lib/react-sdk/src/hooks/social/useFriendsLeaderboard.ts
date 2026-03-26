import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useFriendsLeaderboard() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["leaderboard", "friends", wallet],
		enabled: !!wallet,
		queryFn: async () => {
			const result = await parseResponse(
				api.rpc.users.social.leaderboard.friends.$get(),
			);

			if (!result.success) {
				throw new Error(result.error ?? "Failed to fetch friends leaderboard");
			}

			return result.data.leaderboard;
		},
	});
}

import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useWeeklyLeaderboard() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["leaderboard", "weekly", wallet],
		enabled: !!wallet,
		queryFn: async () => {
			const result = await parseResponse(
				api.rpc.users.social.leaderboard.weekly.$get(),
			);

			if (!result.success) {
				throw new Error(result.error ?? "Failed to fetch weekly leaderboard");
			}

			return result.data.leaderboard;
		},
	});
}

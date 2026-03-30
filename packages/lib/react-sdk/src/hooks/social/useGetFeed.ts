import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export type FeedPost = {
	id: number;
	userWallet: string;
	username: string | null;
	payload:
		| { type: "chapter-completion"; chapterId: string }
		| { type: "streak-extension"; newStreak: number }
		| {
				type: "friend-streak-extension";
				friendWallet: string;
				newStreak: number;
		  }
		| { type: "leaderboard-ranking"; rank: number };
	createdAt: string;
};

export function useGetFeed() {
	const { wallet, api } = usePanthaContext();
	return useQuery({
		queryKey: ["social-feed"],
		enabled: !!wallet,
		staleTime: 30_000,
		queryFn: async () => {
			const response = await parseResponse(api.rpc.users.social.feed.$get());
			if (!response.success) throw new Error("Failed to fetch feed");
			return response.data.posts as FeedPost[];
		},
	});
}

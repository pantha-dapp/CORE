import { getEffectiveStreak } from "@pantha/shared";
import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUserInfo(args: { walletAddress?: string }) {
	const { walletAddress } = args;
	const { wallet, api } = usePanthaContext();
	const enabled =
		!!wallet?.account.address && !!walletAddress && !!api.jwtExists;

	return useQuery({
		queryKey: ["userInfo", walletAddress],
		queryFn: async () => {
			if (!wallet || !api.jwtExists || !walletAddress) {
				throw new Error("not connected");
			}

			const userResponse = await parseResponse(
				api.rpc.users[":wallet"].$get({
					param: { wallet: walletAddress },
				}),
			);
			if (!userResponse.success) {
				throw new Error("Failed to retrieve user information");
			}

			return userResponse.data;
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		enabled,
		select: (data) => ({
			...data,
			user: {
				...data.user,
				streak: {
					...data.user.streak,
					currentStreak: getEffectiveStreak(data.user.streak),
				},
			},
		}),
	});
}

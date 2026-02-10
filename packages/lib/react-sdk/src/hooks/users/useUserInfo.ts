import { HOUR } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUserInfo(args: { walletAddress?: string }) {
	const { walletAddress } = args;
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["userInfo", walletAddress],
		queryFn: async () => {
			if (!wallet || !api.jwtExists || !walletAddress) {
				throw new Error("not connected");
			}

			const userResponseRaw = await api.rpc.users[":wallet"].$get({
				param: { wallet: walletAddress },
			});
			const userResponse = await userResponseRaw.json();

			if (!userResponse.success) {
				throw new Error("Failed to retrieve user information");
			}

			return userResponse.data;
		},
		staleTime: 1 * HOUR,
		enabled: !!wallet?.account.address,
	});
}

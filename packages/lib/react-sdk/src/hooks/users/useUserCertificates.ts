import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUserCertificates(args: { walletAddress?: string }) {
	const { wallet, api } = usePanthaContext();
	const { walletAddress } = args;

	return useQuery({
		queryKey: ["userCertificates", walletAddress],
		queryFn: async () => {
			if (!wallet || !walletAddress) {
				throw new Error("not connected");
			}

			const res = await api.rpc.users[":wallet"].certificates.$get({
				param: { wallet: walletAddress },
			});
			const data = await res.json();

			if (!data.success) {
				throw new Error("failed to fetch certificates");
			}

			return data.data;
		},
		enabled: !!walletAddress,
	});
}

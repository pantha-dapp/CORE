import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUserCourses(args: { walletAddress?: string }) {
	const { wallet, api } = usePanthaContext();
	const { walletAddress } = args;
	const enabled = !!walletAddress && !!wallet && !!api.jwtExists;

	return useQuery({
		queryKey: ["userCourses", walletAddress],
		queryFn: async () => {
			if (!enabled) {
				throw new Error("not connected");
			}

			const enrollmentsResponseRaw = await api.rpc.users[
				":wallet"
			].courses.$get({ param: { wallet: walletAddress } });
			const enrollmentsResponse = await enrollmentsResponseRaw.json();

			if (!enrollmentsResponse.success) {
				throw new Error("failed to fetch enrollments");
			}

			return enrollmentsResponse.data;
		},
		staleTime: 5 * 60 * 1000,
		enabled,
	});
}

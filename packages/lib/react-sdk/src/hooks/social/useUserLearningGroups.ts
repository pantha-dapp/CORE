import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useUserLearningGroups() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["user-learning-groups", wallet],
		enabled: !!wallet,
		queryFn: async () => {
			const response = await api.rpc.users.social.groups.$get();
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error ?? "Failed to fetch learning groups");
			}

			return result.data.groups;
		},
	});
}

import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useLearningGroupMembers(chatId?: number) {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["learning-group-members", chatId],
		enabled: !!wallet && chatId !== undefined,
		queryFn: async () => {
			const response = await api.rpc.users.social.groups[
				":chatId"
			].members.$get({
				param: { chatId: String(chatId) },
			});
			const result = await response.json();

			if (!result.success) {
				throw new Error(
					result.error ?? "Failed to fetch learning group members",
				);
			}

			return result.data.members;
		},
	});
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useChapterGameAnswer() {
	const { wallet, api } = usePanthaContext();

	const queryClient = useQueryClient();

	function refreshSession() {
		queryClient.invalidateQueries({
			queryKey: ["last-chapter-game-session"],
		});
		queryClient.refetchQueries({
			queryKey: ["last-chapter-game-session"],
		});
	}

	return useMutation({
		mutationFn: async (args: { answer: string[] }) => {
			const { answer } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const actionResponseRaw =
				await api.rpc.course.chapters.session.answer.$post({
					json: { answer },
				});
			const actionResponse = await actionResponseRaw.json();

			if (actionResponse.success) {
				refreshSession();
			} else {
				throw new Error("Failed to perform action", {
					cause: actionResponse.error,
				});
			}

			return actionResponse.data;
		},
	});
}

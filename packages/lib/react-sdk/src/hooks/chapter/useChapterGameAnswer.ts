import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useChapterGameAnswer(args?: { chapterId?: string }) {
	const { wallet, api } = usePanthaContext();

	const queryClient = useQueryClient();
	const chapterId = args?.chapterId;

	return useMutation({
		mutationFn: async (args: { answer: string[] }) => {
			const { answer } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const actionResponseRaw =
				await api.rpc.courses.chapters.session.answer.$post({
					json: { answer },
				});
			const actionResponse = await actionResponseRaw.json();

			if (!actionResponse.success) {
				throw new Error("Failed to perform action", {
					cause: actionResponse.error,
				});
			}

			const data = actionResponse.data;

			if (data.complete) {
				queryClient.invalidateQueries({
					queryKey: ["userInfo"],
				});
				queryClient.refetchQueries({
					queryKey: ["userInfo"],
				});
			} else {
				if (chapterId) {
					queryClient.setQueryData(["last-chapter-game-session", chapterId], {
						chapterId,
						currentPage: data.currentPage,
					});
				}
			}

			return data;
		},
	});
}

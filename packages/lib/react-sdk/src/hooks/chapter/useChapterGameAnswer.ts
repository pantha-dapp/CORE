import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useChapterGameAnswer(args?: { chapterId?: string }) {
	const { wallet, api } = usePanthaContext();

	const queryClient = useQueryClient();
	const chapterId = args?.chapterId;

	function refreshSession() {
		if (chapterId) {
			queryClient.invalidateQueries({
				queryKey: ["last-chapter-game-session", chapterId],
			});
			queryClient.refetchQueries({
				queryKey: ["last-chapter-game-session", chapterId],
			});
		} else {
			// Fallback: invalidate all sessions
			queryClient.invalidateQueries({
				queryKey: ["last-chapter-game-session"],
			});
			queryClient.refetchQueries({
				queryKey: ["last-chapter-game-session"],
			});
		}
	}

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

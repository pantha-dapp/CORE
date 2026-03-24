import { jsonStringify } from "@pantha/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useSelfActionHash } from "../users/useSelfActionHash";
import { useChapterGameSession } from "./useChapterGameSession";

export function useChapterGameAnswer(args?: { chapterId?: string }) {
	const { wallet, api } = usePanthaContext();

	const queryClient = useQueryClient();
	const chapterId = args?.chapterId;

	const prevHash = useSelfActionHash();
	const session = useChapterGameSession({ enabled: true });

	return useMutation({
		mutationFn: async (args: { answer: string[] }) => {
			const { answer } = args;

			if (!wallet || !session.data?.currentPage) {
				throw new Error("not connected");
			}

			while (prevHash.isLoading) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			const message = jsonStringify({
				prevHash: prevHash.data,
				userWallet: wallet.account.address,
				label: "page:answer",
				data: {
					chapterId: chapterId,
					pageId: session.data.currentPage,
					correct: true,
				},
			});
			const signature = await wallet.signMessage({ message });

			const actionResponseRaw =
				await api.rpc.courses.chapters.session.answer.$post({
					json: { answer },
					header: { "X-Signature": signature },
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

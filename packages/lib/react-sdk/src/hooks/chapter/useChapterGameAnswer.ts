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

			if (!data.complete && chapterId) {
				queryClient.setQueryData(["last-chapter-game-session", chapterId], {
					chapterId,
					currentPage: data.currentPage,
				});
			}

			return data;
		},
		onSuccess: (data) => {
			if (!data.complete) return;

			const walletAddress = wallet?.account.address;

			// Immediate invalidate + refetch — picks up pending XP log (counted by server)
			queryClient.invalidateQueries({ queryKey: ["userInfo", walletAddress] });
			queryClient.refetchQueries({ queryKey: ["userInfo", walletAddress] });

			// Second refetch after 4 s — by then the on-chain tx is likely confirmed
			// and the XP log status transitions from "pending" → "success"
			setTimeout(() => {
				queryClient.refetchQueries({ queryKey: ["userInfo", walletAddress] });
			}, 4_000);

			// Also invalidate course enrollments so progress bar updates
			queryClient.invalidateQueries({ queryKey: ["userEnrollments"] });
			queryClient.invalidateQueries({ queryKey: ["userCourses"] });
		},
	});
}

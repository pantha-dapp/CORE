import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useEvent } from "../../context/SseProvider";

const PAGE_SIZE = 50;

export function useLearningGroupMessages(chatId?: number) {
	const { wallet, api } = usePanthaContext();
	const queryClient = useQueryClient();

	const enabled = !!wallet && chatId !== undefined;

	const query = useInfiniteQuery({
		queryKey: ["learning-group-messages", chatId],
		initialPageParam: 0,
		enabled,
		queryFn: async ({ pageParam: offset }) => {
			if (!enabled) throw new Error("Not connected.");

			const response = await api.rpc.users.social.groups[
				":chatId"
			].messages.$get({
				param: { chatId: String(chatId) },
				query: { offset },
			});
			const result = await response.json();

			if (!result.success) {
				throw new Error(
					result.error ?? "Failed to fetch learning group messages",
				);
			}

			return { messages: result.data.messages, offset };
		},
		getNextPageParam: (lastPage) => {
			if (lastPage.messages.length < PAGE_SIZE) return undefined;
			return lastPage.offset + lastPage.messages.length;
		},
	});

	useEvent(
		"learning-group:message",
		useCallback(
			(data: unknown) => {
				const payload = data as { learningGroupChatId?: number; from?: string };
				if (payload.learningGroupChatId !== chatId) return;

				queryClient.invalidateQueries({
					queryKey: ["learning-group-messages", chatId],
					refetchType: "active",
				});
			},
			[chatId, queryClient],
		),
	);

	return query;
}

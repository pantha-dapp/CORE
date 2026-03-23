import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useSendLearningGroupMessage() {
	const { wallet, api } = usePanthaContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (args: { chatId: number; content: string }) => {
			const { chatId, content } = args;

			if (!wallet) throw new Error("Wallet not connected.");

			const response = await parseResponse(
				api.rpc.users.social.groups[":chatId"].messages.$post({
					param: { chatId: String(chatId) },
					json: { content },
				}),
			);

			if (!response.success) {
				console.error(
					`Failed to send learning group message: ${response.error}`,
				);
				return { success: false, error: response.error };
			}

			return { success: true, data: response.data };
		},
		onSuccess: (result, { chatId }) => {
			if (result.success) {
				queryClient.invalidateQueries({
					queryKey: ["learning-group-messages", chatId],
					refetchType: "active",
				});
			}
		},
	});
}

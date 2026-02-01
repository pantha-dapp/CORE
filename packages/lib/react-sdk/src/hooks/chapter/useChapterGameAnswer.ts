import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { useEffect, useRef, useState } from "react";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useJobStatus } from "../job";

export function useChapterGameAnswer() {
	const { wallet, api } = usePanthaContext();

	const queryClient = useQueryClient();

	const flag = useRef(false);

	function refreshSession() {
		queryClient.invalidateQueries({
			queryKey: ["last-course-generation-session"],
		});
		queryClient.refetchQueries({
			queryKey: ["last-course-generation-session"],
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

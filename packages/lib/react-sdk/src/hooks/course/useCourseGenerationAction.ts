import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { useEffect, useRef, useState } from "react";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useJobStatus } from "../job";

export function useCourseGenerationAction() {
	const { wallet, api } = usePanthaContext();

	const [currentAwaitedJob, setCurrentAwaitedJob] = useState<string>();
	const currentJobStatus = useJobStatus({ jobId: currentAwaitedJob });
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

	useEffect(() => {
		if (!flag.current) {
			if (currentJobStatus.data?.state !== "pending") {
				flag.current = true;
				refreshSession();
			}
		}
	}, [currentJobStatus.data]);

	return useMutation({
		mutationFn: async (args: {
			action: InferRequestType<typeof api.rpc.course.gen.action.$post>["json"];
		}) => {
			const { action } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const actionResponseRaw = await api.rpc.course.gen.action.$post({
				json: action,
			});
			const actionResponse = await actionResponseRaw.json();
			if (actionResponse.success) {
				if (actionResponse.data.jobId) {
					setCurrentAwaitedJob(actionResponse.data.jobId);
					flag.current = false;
				} else {
					refreshSession();
				}
			}

			return currentJobStatus.data;
		},
	});
}

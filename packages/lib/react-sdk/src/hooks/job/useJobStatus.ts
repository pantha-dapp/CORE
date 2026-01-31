import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useJobStatus(args: { jobId: string | undefined }) {
	const { jobId } = args;
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["job-status", jobId],
		queryFn: async () => {
			if (!wallet || !jobId) {
				throw new Error("jobId missing or wallete not connected");
			}

			const jobStatusResponseRaw = await api.rpc.jobs[":id"].$get({
				param: { id: jobId },
			});
			const jobStatusResponse = await jobStatusResponseRaw.json();

			if (!jobStatusResponse.success) {
				throw new Error("Failed to fetch job status", {
					cause: jobStatusResponse.error,
				});
			}

			return jobStatusResponse.data;
		},

		refetchInterval: (o) => {
			const status = o.state.data?.state;

			if (!status) return 1000;
			if (status === "success") return false;
			if (status === "failed") return false;

			return 1000; // poll
		},
		refetchIntervalInBackground: true,

		enabled: !!jobId,
	});
}

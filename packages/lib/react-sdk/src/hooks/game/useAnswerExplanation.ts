import { MINUTE } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useAnswerExplanation() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["previousAnswerExplanation"],
		enabled: false,
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const explanationResponseRaw =
				await api.rpc.courses.chapters.session.explanation.$get();
			const explanationResponse = await explanationResponseRaw.json();

			if (!explanationResponse.success) {
				throw new Error("Failed to retreive  session ", {
					cause: explanationResponse.error,
				});
			}

			return explanationResponse.data;
		},
		staleTime: 2 * MINUTE,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});
}

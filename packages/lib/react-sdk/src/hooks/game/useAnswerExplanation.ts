import { MINUTE } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useAnswerExplanation() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["previousAnswerExplanation"],
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const sessionResponseRaw = await api.rpc.courses.gen.session.$get();
			const sessionResponse = await sessionResponseRaw.json();

			if (!sessionResponse.success) {
				throw new Error("Failed to retreive  session ", {
					cause: sessionResponse.error,
				});
			}

			return sessionResponse.data;
		},
		staleTime: 2 * MINUTE,
	});
}

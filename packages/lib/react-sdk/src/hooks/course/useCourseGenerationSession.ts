import { MINUTE } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useCourseGenerationSession() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["last-course-generation-session"],
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const sessionResponseRaw = await api.rpc.course.gen.session.$get();
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

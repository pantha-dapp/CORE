import { MINUTE } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useCourseExploration(args: { id?: string }) {
	const { id } = args;
	const { wallet, api } = usePanthaContext();

	const enabled = !!wallet && !!id;

	return useQuery({
		queryKey: ["courseExploration", id],
		queryFn: async () => {
			if (!enabled) {
				throw new Error("not connected");
			}

			const courses = await parseResponse(api.rpc.courses.explore.$get());

			if (!courses.success) {
				throw new Error("Failed to retrieve courses");
			}

			return {
				explore: courses.data.courses,
				suggestions: courses.data.suggestions,
			};
		},
		enabled,
		retryDelay: 2 * MINUTE,
	});
}

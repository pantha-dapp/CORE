import { DAY } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useCourseGenerationMajorCategories() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["courseGenerationMajorCategories"],
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const categoriesResponseRaw = await api.rpc.course.gen.categories.$get();
			const categoriesResponse = await categoriesResponseRaw.json();

			if (!categoriesResponse.success) {
				throw new Error("Failed to retrieve categories");
			}

			return categoriesResponse.data;
		},
		staleTime: 7 * DAY,
	});
}

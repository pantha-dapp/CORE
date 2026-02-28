import { DAY } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useChapterPages(args: { chapterId?: string }) {
	const { wallet, api } = usePanthaContext();
	const { chapterId } = args;

	const enabled = !!wallet && !!chapterId;

	return useQuery({
		queryKey: ["chapterPages", chapterId],
		queryFn: async () => {
			if (!enabled) {
				throw new Error("unreachable");
			}

			const pagesResponseRaw = await api.rpc.courses.chapters[":id"].pages.$get(
				{
					param: { id: chapterId },
				},
			);
			const pagesResponse = await pagesResponseRaw.json();

			if (!pagesResponse.success) {
				throw new Error("Failed to retrieve pages");
			}

			return pagesResponse.data;
		},
		enabled,
		staleTime: 7 * DAY,
	});
}

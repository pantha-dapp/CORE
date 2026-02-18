import { DAY } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useCourseChaptersByCourseId(args: { courseId: string }) {
	const { wallet, api } = usePanthaContext();
	const { courseId } = args;

	return useQuery({
		queryKey: ["courseChaptersByCourseId", courseId],
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const chaptersResponseRaw = await api.rpc.courses[":id"].chapters.$get({
				param: { id: courseId },
			});
			const chaptersResponse = await chaptersResponseRaw.json();

			if (!chaptersResponse.success) {
				throw new Error("Failed to retrieve chapters");
			}

			return chaptersResponse.data;
		},
		staleTime: 7 * DAY,
	});
}

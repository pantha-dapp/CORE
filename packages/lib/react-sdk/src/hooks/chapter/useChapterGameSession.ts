import { MINUTE } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useCourseGameSession(args: { chapterId: string }) {
	const { wallet, api } = usePanthaContext();
	const { chapterId } = args;

	return useQuery({
		queryKey: ["last-chapter-game-session", chapterId],
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const sessionResponseRaw = await api.rpc.course.chapters.session.$get({
				query: { chapterId },
			});
			const sessionResponse = await sessionResponseRaw.json();

			if (!sessionResponse.success) {
				throw new Error("Failed to retreive session ", {
					cause: sessionResponse.error,
				});
			}

			return sessionResponse.data;
		},
		staleTime: 2 * MINUTE,
	});
}

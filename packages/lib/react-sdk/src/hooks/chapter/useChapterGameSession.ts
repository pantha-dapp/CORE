import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useChapterGameSession(args: { chapterId?: string }) {
	const { wallet, api } = usePanthaContext();
	const { chapterId } = args;

	const enabled = !!wallet && !!chapterId;

	return useQuery({
		queryKey: ["last-chapter-game-session", chapterId],
		queryFn: async () => {
			if (!enabled) {
				throw new Error("unreachable");
			}

			const sessionResponseRaw = await api.rpc.courses.chapters.session.$get({
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
		enabled,
	});
}

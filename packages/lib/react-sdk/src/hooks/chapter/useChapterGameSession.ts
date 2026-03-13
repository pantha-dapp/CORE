import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useChapterGameSession(args: {
	chapterId?: string;
	/** When false, session is not fetched. Use to wait until chapter pages are ready. */
	enabled?: boolean;
}) {
	const { wallet, api } = usePanthaContext();
	const { chapterId, enabled: enabledOverride } = args;

	const enabled = (enabledOverride ?? true) && !!wallet && !!chapterId;

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

import { DAY } from "@pantha/shared/constants";
import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

const RETRY_DELAY_MS = 10_000;
const MAX_503_RETRIES = 30;

/** Error thrown when chapter pages are not ready (503) - used for retry logic */
export class ChapterNotReadyError extends Error {
	constructor(message = "Chapter pages unavailable") {
		super(message);
		this.name = "ChapterNotReadyError";
	}
}

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

			if (pagesResponseRaw.status === 503) {
				throw new ChapterNotReadyError("Chapter is being prepared");
			}

			const pagesResponse = await pagesResponseRaw.json();

			if (!pagesResponse.success) {
				throw new Error("Failed to retrieve pages");
			}

			return pagesResponse.data;
		},
		enabled,
		staleTime: 7 * DAY,
		retry: (failureCount, error) =>
			error instanceof ChapterNotReadyError && failureCount < MAX_503_RETRIES,
		retryDelay: RETRY_DELAY_MS,
	});
}

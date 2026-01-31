// import { useQuery } from "@tanstack/react-query";
// import { usePanthaContext } from "../../context/PanthaProvider";

// export function useChapterGame(args: { chapterId: string | undefined }) {
// 	const { chapterId } = args;
// 	const { wallet, api } = usePanthaContext();

// 	return useQuery({
// 		queryKey: ["chapter-game", chapterId],
// 		queryFn: async () => {
// 			if (!wallet || !chapterId) {
// 				throw new Error("chapterId missing or wallete not connected");
// 			}

// 			const game = api.ws["chapter-game"][":id"].$ws({
// 				param: { id: chapterId },
// 			});

// 			return {};
// 		},
// 	});
// }

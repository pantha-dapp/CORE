import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

type FeedPostVars =
	| { type: "streak-extension" }
	| { type: "chapter-completion"; chapterId: string };

export function useFeedPost() {
	const { wallet, api } = usePanthaContext();

	return useMutation<boolean, Error, FeedPostVars>({
		mutationFn: async (vars) => {
			if (!wallet) throw new Error("not connected");

			if (vars.type === "streak-extension") {
				const result = await parseResponse(
					api.rpc.users.social.feed["share-streak-extension"].$post(),
				);
				if (!result.success) throw new Error(result.error ?? "Failed to share");
			} else {
				const result = await parseResponse(
					api.rpc.users.social.feed["share-chapter-completion"].$post({
						json: { chapterId: vars.chapterId },
					}),
				);
				if (!result.success) throw new Error(result.error ?? "Failed to share");
			}
			return true;
		},
	});
}

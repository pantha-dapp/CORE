import { useMutation } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useChapterGameSessionDelete() {
	const { api } = usePanthaContext();

	return useMutation({
		mutationFn: async () => {
			const response = await api.rpc.courses.chapters.session.$delete();
			return await response.json();
		},
	});
}

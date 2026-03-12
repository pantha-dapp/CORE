import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useCourseGenerationSessionReset() {
	const { wallet, api } = usePanthaContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const response = await api.rpc.courses.gen.session.$delete();
			const result = await response.json();

			if (!result.success) {
				throw new Error("Failed to reset session");
			}

			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["last-course-generation-session"],
			});
			queryClient.refetchQueries({
				queryKey: ["last-course-generation-session"],
			});
		},
	});
}

import { useMutation } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useNewCourseGenerationSession() {
	const { wallet, api } = usePanthaContext();

	return useMutation({
		mutationFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const newSessionResponseRaw = await api.rpc.course.gen.session.$post();
			const newSessionResponse = await newSessionResponseRaw.json();

			if (!newSessionResponse.success) {
				throw new Error("Failed to start a session ", {
					cause: newSessionResponse.error,
				});
			}

			return newSessionResponse.success;
		},
	});
}

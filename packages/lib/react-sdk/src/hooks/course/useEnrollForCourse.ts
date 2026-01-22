import { useMutation } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useEnrollForCourse() {
	const { wallet, api } = usePanthaContext();

	return useMutation({
		mutationFn: async (args: { courseId: string }) => {
			const { courseId } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const enrollResponseRaw = await api.rpc.course.enroll.$post({
				json: {
					courseId,
				},
			});
			const enrollResponse = await enrollResponseRaw.json();

			if (!enrollResponse.success) {
				throw new Error("Failed to perform action", {
					cause: enrollResponse.error,
				});
			}

			return enrollResponse.data;
		},
	});
}

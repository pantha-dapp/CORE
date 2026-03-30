import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useRequestCertificate() {
	const { api } = usePanthaContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (courseId: string) => {
			const res = await api.rpc.courses[":id"].certification.$post({
				param: { id: courseId },
			});
			const data = await res.json();

			if (!data.success) {
				throw new Error(
					(data as { error?: string }).error ?? "Failed to request certificate",
				);
			}

			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userCertificates"] });
			queryClient.invalidateQueries({ queryKey: ["userCourses"] });
		},
	});
}

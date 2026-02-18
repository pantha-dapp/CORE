import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useCourseById(args: { id: string }) {
	const { id } = args;
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["courseById", id],
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const courseResponseRaw = await api.rpc.courses[":id"].$get({
				param: { id },
			});
			const courseResponse = await courseResponseRaw.json();

			if (!courseResponse.success) {
				throw new Error("Failed to retrieve course");
			}

			return courseResponse.data;
		},
	});
}

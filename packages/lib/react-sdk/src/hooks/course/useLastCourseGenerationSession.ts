import { useQuery } from "@tanstack/react-query";
import { MINUTE } from "../../../../../server/constants";
import { usePanthaContext } from "../../context/PanthaProvider";

export default function () {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["last-course-generation-session"],
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const newSessionResponseRaw = await api.rpc.course.gen.session.$get();
			const newSessionResponse = await newSessionResponseRaw.json();

			if (!newSessionResponse.success) {
				throw new Error("Failed to retreive  session ", {
					cause: newSessionResponse.error,
				});
			}

			return newSessionResponse.data;
		},
		staleTime: 2 * MINUTE,
	});
}

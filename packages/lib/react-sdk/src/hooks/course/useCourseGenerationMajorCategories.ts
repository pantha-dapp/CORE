import { useMutation } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export default function () {
	const { wallet, api } = usePanthaContext();

	return useMutation({
		mutationFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const categoriesResponseRaw = await api.rpc.course.gen.categories.$get();
			const categoriesResponse = await categoriesResponseRaw.json();

			if (!categoriesResponse.success) {
				throw new Error("Failed to retrieve categories");
			}

			return categoriesResponse.data;
		},
	});
}

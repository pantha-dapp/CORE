import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";
import { idb } from "../../utils/idb";

const storage = idb({ db: "pantha", store: "auth" });

export function useLogout() {
	const { api } = usePanthaContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await storage.del("jwt");
			api.setJwt(null);

			return true;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["is-logged-in"] });
		},
	});
}

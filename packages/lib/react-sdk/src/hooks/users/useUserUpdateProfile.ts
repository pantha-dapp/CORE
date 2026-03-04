import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

type UpdateProfileArgs = {
	name?: string;
	username?: string;
	profileVisibility?: "public" | "private";
};

export function useUserUpdateProfile() {
	const { wallet, api } = usePanthaContext();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (args: UpdateProfileArgs) => {
			if (!wallet || !api.jwtExists) {
				throw new Error("not connected");
			}

			const responseRaw = await api.rpc.users.me.$put({
				json: args,
			});
			const response = await responseRaw.json();

			if (!response.success) {
				throw new Error("Failed to update profile");
			}

			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["userInfo", wallet?.account.address],
			});
		},
	});
}

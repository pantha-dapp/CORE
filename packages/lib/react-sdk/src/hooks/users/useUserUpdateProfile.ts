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
		onMutate: async (variables) => {
			if (variables.profileVisibility !== undefined) {
				const qk = ["userInfo", wallet?.account.address];
				await queryClient.cancelQueries({ queryKey: qk });
				const prev = queryClient.getQueryData(qk);
				queryClient.setQueryData(qk, (old: unknown) => {
					const o = old as { user?: Record<string, unknown> } | undefined;
					if (!o?.user) return old;
					return {
						...o,
						user: { ...o.user, profileVisibility: variables.profileVisibility },
					};
				});
				return { prev };
			}
		},
		onError: (_err, _args, context) => {
			const ctx = context as { prev?: unknown } | undefined;
			if (ctx?.prev !== undefined) {
				queryClient.setQueryData(
					["userInfo", wallet?.account.address],
					ctx.prev,
				);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["userInfo", wallet?.account.address],
			});
		},
	});
}

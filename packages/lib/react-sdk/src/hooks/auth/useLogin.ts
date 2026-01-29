import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSiweMessage } from "viem/siwe";
import { usePanthaContext } from "../../context/PanthaProvider";
import { idb } from "../../utils/idb";
import { useIsLoggedIn } from "./useIsLoggedIn";
import { useLogout } from "./useLogout";

const storage = idb({ db: "pantha", store: "auth" });

export function useLogin() {
	const { api, wallet } = usePanthaContext();
	const queryClient = useQueryClient();

	const { data: isLoggedIn } = useIsLoggedIn();
	const { mutate: logout } = useLogout();

	return useMutation({
		mutationFn: async () => {
			if (isLoggedIn) return true;

			console.log("here I get undefined:", wallet);

			if (!wallet) {
				logout();
				throw new Error("Wallet not connected");
			}

			const storedToken = await storage.get<string>("jwt");
			if (storedToken) {
				api.setJwt(storedToken);
				const validationResponse = await api.rpc.auth.validate.$get();
				const validationData = await validationResponse.json();

				if (validationData.success && validationData.data?.valid) {
					return true;
				} else {
					await storage.del("jwt");
					api.setJwt(null);
				}
			}

			const address = wallet.account.address;

			const nonceResponse = await api.rpc.auth.nonce.$get({
				query: { address },
			});
			const nonceData = await nonceResponse.json();

			if (!nonceData.success || !nonceData.data?.nonce) {
				throw new Error("Failed to get nonce from server");
			}

			const { nonce } = nonceData.data;

			const message = createSiweMessage({
				address,
				chainId: wallet.chain.id,
				domain: window.location.host,
				nonce,
				uri: window.location.origin,
				version: "1",
			});

			const signature = await wallet.signMessage({
				message,
			});

			const verifyResponse = await api.rpc.auth.verify.$post({
				json: { message, signature },
			});
			const verifyData = await verifyResponse.json();

			if (!verifyData.success || !verifyData.data?.token) {
				const errorMsg =
					"error" in verifyData
						? verifyData.error
						: "Failed to verify signature";
				throw new Error(errorMsg);
			}

			const { token } = verifyData.data;

			await storage.put("jwt", token);
			api.setJwt(token);

			return true;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["is-logged-in"] });
		},
	});
}

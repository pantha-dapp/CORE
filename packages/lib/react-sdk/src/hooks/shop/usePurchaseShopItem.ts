import { eip712signature } from "@pantha/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";
import { usePanthaTokenDecimals } from "../wallet";
import { useShopItems } from "./useShopItems";

export function usePurchaseShopItem() {
	const { wallet, api, contracts } = usePanthaContext();
	const queryClient = useQueryClient();
	const { data: decimals, isLoading: decimalsLoading } =
		usePanthaTokenDecimals();
	const { data: shopItems, isLoading: shopItemsLoading } = useShopItems();

	return useMutation({
		mutationKey: ["purchaseShopItem", wallet?.account.address],
		mutationFn: async (args: { itemId: string }) => {
			const { itemId } = args;
			if (!wallet || !contracts) throw new Error("not connected");

			while (shopItemsLoading || decimalsLoading) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			const currentNonce = await contracts.PanthaToken.read.nonces([
				wallet.account.address,
			]);

			const item = shopItems?.items.find((i) => i.id === itemId);
			if (!item) throw new Error("Item not found");
			if (decimals === undefined) throw new Error("Token decimals not loaded");

			const deadline = Math.floor(Date.now() / 1000) + 600;

			const signature = await eip712signature(contracts, "PanthaToken", {
				types: {
					Permit: [
						{ name: "owner", type: "address" },
						{ name: "spender", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "nonce", type: "uint256" },
						{ name: "deadline", type: "uint256" },
					],
				},
				primaryType: "Permit",
				message: {
					owner: contracts.$client.account.address,
					spender: contracts.PanthaShop.address,
					value: item.priceHuman * 10 ** decimals,
					nonce: Number(currentNonce),
					deadline: deadline,
				},
			});

			const response = await parseResponse(
				api.rpc.shop.buy.$post({
					query: {
						itemId,
						signature,
						deadline: deadline.toString(),
					},
				}),
			);

			if (!response.success) {
				throw new Error(response.error || "Purchase failed");
			}
			const receipt = await contracts.$publicClient.waitForTransactionReceipt({
				hash: response.data.txHash,
			});

			if (receipt.status === "success") {
				await queryClient.invalidateQueries({
					queryKey: ["userPurchases"],
				});
				await queryClient.refetchQueries({
					queryKey: ["userPurchases"],
				});
				return true;
			} else {
				return false;
			}
		},
	});
}

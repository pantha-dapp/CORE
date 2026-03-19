import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

type BuyShopItemParams = {
	itemId: string;
	signature: string;
	deadline: string;
};

export function useBuyShopItems() {
	const { api } = usePanthaContext();

	return useMutation({
		mutationFn: async (params: BuyShopItemParams) => {
			const response = await parseResponse(
				api.rpc.shop.buy.$post({
					query: {
						itemId: params.itemId,
						signature: params.signature,
						deadline: params.deadline,
					},
				}),
			);

			if (!response.success) {
				throw new Error(response.error);
			}

			return response.data;
		},
	});
}

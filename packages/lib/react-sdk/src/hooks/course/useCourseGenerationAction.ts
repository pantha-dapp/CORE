import { useMutation } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { usePanthaContext } from "../../context/PanthaProvider";

export default function () {
	const { wallet, api } = usePanthaContext();

	return useMutation({
		mutationFn: async (args: {
			action: InferRequestType<typeof api.rpc.course.gen.action.$post>["json"];
		}) => {
			const { action } = args;

			if (!wallet) {
				throw new Error("not connected");
			}

			const actionResponseRaw = await api.rpc.course.gen.action.$post({
				json: action,
			});
			const actionResponse = (await actionResponseRaw.json()) as {
				success?: unknown;
				error?: unknown;
			};

			if (!("success" in actionResponse)) {
				throw new Error("Failed to perform action", {
					cause: actionResponse.error,
				});
			}

			return actionResponse.success;
		},
	});
}

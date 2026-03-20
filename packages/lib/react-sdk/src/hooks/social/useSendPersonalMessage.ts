import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { toHex } from "viem";
import type { Address } from "viem/accounts";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useEncryptionService } from "../crypto";

export function useSendPersonalMessage() {
	const { wallet, api } = usePanthaContext();
	const { encrypt } = useEncryptionService();

	return useMutation({
		mutationFn: async (args: { recipient: Address; message: string }) => {
			const { recipient, message } = args;

			if (!wallet) throw new Error("Wallet not connected.");

			const encryptedMessage = await encrypt({
				recipientAddress: recipient,
				plaintext: message,
			});

			const response = await parseResponse(
				api.rpc.users.social.dm.$post({
					json: {
						recipientWallet: recipient,
						ciphertext: toHex(encryptedMessage),
					},
				}),
			);

			if (!response.success) {
				console.error(`Failed to send DM: ${response.error}`);
				return { success: false, error: response.error };
			}

			return { success: true };
		},
	});
}

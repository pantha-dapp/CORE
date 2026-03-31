import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { toHex } from "viem";
import type { Address } from "viem/accounts";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useEncryptionService } from "../crypto";

export function useSendPersonalMessage() {
	const { wallet, api } = usePanthaContext();
	const { encrypt } = useEncryptionService();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (args: { recipient: Address; message: string }) => {
			const { recipient, message } = args;

			console.log("[useSendPersonalMessage] mutationFn called", {
				recipient,
				messageLength: message.length,
			});
			console.log("[useSendPersonalMessage] wallet:", wallet);

			if (!wallet) {
				console.error(
					"[useSendPersonalMessage] wallet not connected — aborting",
				);
				throw new Error("Wallet not connected.");
			}

			console.log("[useSendPersonalMessage] calling encrypt...");
			let encryptedMessage: Uint8Array;
			try {
				encryptedMessage = await encrypt({
					recipientAddress: recipient,
					plaintext: message,
				});
				console.log(
					"[useSendPersonalMessage] encryption succeeded, ciphertext length:",
					encryptedMessage.length,
				);
			} catch (err) {
				console.error("[useSendPersonalMessage] encryption failed:", err);
				throw err;
			}

			const ciphertext = toHex(encryptedMessage);
			console.log("[useSendPersonalMessage] posting DM to API...", {
				recipientWallet: recipient,
				ciphertextPrefix: ciphertext.slice(0, 20),
			});

			const response = await parseResponse(
				api.rpc.users.social.dm.$post({
					json: {
						recipientWallet: recipient,
						ciphertext,
					},
				}),
			).catch((err: unknown) => {
				console.error(
					"[useSendPersonalMessage] API call / parseResponse threw:",
					err,
				);
				throw err;
			});
			console.log("[useSendPersonalMessage] API response:", response);

			if (!response.success) {
				console.error(
					"[useSendPersonalMessage] API returned failure:",
					response.error,
				);
				return { success: false, error: response.error };
			}

			console.log(
				"[useSendPersonalMessage] DM sent successfully to",
				recipient,
			);
			return { success: true, recipient };
		},
		onSuccess: (result) => {
			console.log("[useSendPersonalMessage] onSuccess:", result);
			if (result.success) {
				// refetchQueries forces an immediate refetch even if the query is
				// in error state (which invalidateQueries won't do reliably).
				queryClient.refetchQueries({
					queryKey: ["personal-messages", result.recipient],
					type: "active",
				});
			}
		},
		onError: (err) => {
			console.error("[useSendPersonalMessage] mutation error:", err);
		},
	});
}

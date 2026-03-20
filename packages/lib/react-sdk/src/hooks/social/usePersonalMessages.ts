import { useInfiniteQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { hexToBytes } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useEncryptionService } from "../crypto";

const PAGE_SIZE = 30;

export function usePersonalMessages(participantWallet: Address | undefined) {
	const { wallet, api } = usePanthaContext();
	const { decrypt } = useEncryptionService();

	return useInfiniteQuery({
		queryKey: ["personal-messages", participantWallet],
		enabled: !!wallet && !!participantWallet,
		initialPageParam: 0,
		queryFn: async ({ pageParam: offset }) => {
			const response = await api.rpc.users.social.dm.$get({
				query: {
					participantWallet: participantWallet,
					offset,
				},
			});
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error ?? "Failed to fetch messages");
			}

			const messages = await Promise.all(
				result.data.messages.map(async (msg) => {
					const plaintext = await decrypt({
						// ECDH shared secret is symmetric — the other party's address
						// works for both sent and received messages in this conversation.
						senderAddress: participantWallet!,
						ciphertext: hexToBytes(msg.ciphertext as `0x${string}`),
					});
					return { ...msg, plaintext };
				}),
			);

			return { messages, offset };
		},
		getNextPageParam: (lastPage) => {
			if (lastPage.messages.length < PAGE_SIZE) return undefined;
			return lastPage.offset + lastPage.messages.length;
		},
	});
}

import { useInfiniteQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { hexToBytes } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useEncryptionService } from "../crypto";

const PAGE_SIZE = 30;

export function usePersonalMessages(participantWallet?: Address) {
	const { wallet, api } = usePanthaContext();
	const { decrypt } = useEncryptionService();

	const enabled = !!wallet && !!participantWallet;

	return useInfiniteQuery({
		queryKey: ["personal-messages", participantWallet],
		initialPageParam: 0,
		enabled,
		queryFn: async ({ pageParam: offset }) => {
			if (!enabled) {
				throw new Error(" not connected.");
			}

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
						senderAddress: participantWallet,
						ciphertext: hexToBytes(msg.ciphertext),
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

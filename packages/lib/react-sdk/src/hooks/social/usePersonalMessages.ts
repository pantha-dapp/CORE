import { zEvmAddress } from "@pantha/shared/zod";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import type { Address } from "viem";
import { hexToBytes } from "viem";
import z from "zod";
import { usePanthaContext } from "../../context/PanthaProvider";
import { useEvent } from "../../context/SseProvider";
import { useEncryptionService } from "../crypto";

const PAGE_SIZE = 30;

export function usePersonalMessages(participantWallet?: Address) {
	const { wallet, api } = usePanthaContext();
	const { decrypt } = useEncryptionService();
	const queryClient = useQueryClient();
	const latestMessageIdRef = useRef<number | null>(null);

	const enabled = !!wallet && !!participantWallet;

	const query = useInfiniteQuery({
		queryKey: ["personal-messages", participantWallet],
		initialPageParam: 0,
		enabled,
		queryFn: async ({ pageParam: offset }) => {
			if (!enabled) {
				throw new Error(" not connected.");
			}

			const response = await api.rpc.users.social.dm.$get({
				query: {
					participantWallet,
					offset,
					...(offset === 0 &&
						latestMessageIdRef.current !== null && {
							after: latestMessageIdRef.current,
						}),
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

			// Track the latest message ID from first page for next refetch
			if (offset === 0 && messages.length > 0) {
				const firstMsg = messages[0] as { id?: number };
				if (firstMsg.id) {
					latestMessageIdRef.current = firstMsg.id;
				}
			}

			return { messages, offset };
		},
		getNextPageParam: (lastPage) => {
			if (lastPage.messages.length < PAGE_SIZE) return undefined;
			return lastPage.offset + lastPage.messages.length;
		},
	});

	useEvent(
		"dm:new",
		useCallback(
			(data: unknown) => {
				const result = z
					.object({
						from: zEvmAddress(),
					})
					.safeParse(data);
				if (!result.success || !participantWallet) return;

				if (
					result.data.from.toLowerCase() === participantWallet.toLowerCase()
				) {
					// Refetch only the first page with 'after' param to get only new messages
					queryClient.invalidateQueries({
						queryKey: ["personal-messages", participantWallet],
						refetchType: "active",
					});
				}
			},
			[participantWallet, queryClient],
		),
	);

	return query;
}

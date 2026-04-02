import { usePanthaContext } from "@pantha/react";
import {
	useEncryptionService,
	useLearningGroupMessages,
	usePersonalMessages,
	useSendLearningGroupMessage,
	useSendPersonalMessage,
	useUserInfo,
} from "@pantha/react/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Loader, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "viem";

type ChatType = "personal" | "group";

interface ChatSession {
	id: string;
	type: ChatType;
	name: string;
	walletAddress?: Address;
	chatId?: number;
}

function ChatWindow({
	session,
	onClose,
	onSendMessage,
	isSending,
	sendError,
}: {
	session: ChatSession;
	onClose: () => void;
	onSendMessage: (content: string, onSuccess: () => void) => void;
	isSending?: boolean;
	sendError?: string | null;
}) {
	const [messageText, setMessageText] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const walletForLookup =
		session.type === "personal" ? session.walletAddress : undefined;
	const queryClient = useQueryClient();
	const cached = queryClient.getQueryData<{ user: { username: string } }>([
		"userInfo",
		walletForLookup,
	]);
	const { data: recipientInfo } = useUserInfo({
		walletAddress: walletForLookup,
	});
	const resolvedName = (() => {
		if (session.type !== "personal") return session.name;
		const username = recipientInfo?.user?.username ?? cached?.user?.username;
		return username ? `${username} (${session.name})` : session.name;
	})();

	const { isKeygenReady, isKeygenPending, keygenError } =
		useEncryptionService();
	const keygenNotReady =
		session.type === "personal" && !isKeygenReady && isKeygenPending;

	const { contracts, wallet } = usePanthaContext();
	const recipientAddress =
		session.type === "personal" ? session.walletAddress : undefined;
	const { data: recipientIsRegistered, isLoading: checkingRecipient } =
		useQuery({
			queryKey: ["recipientRegistered", recipientAddress],
			queryFn: async () => {
				if (!contracts || !recipientAddress) return null;
				return contracts.PanthaKeyStore.read.isRegistered([recipientAddress]);
			},
			enabled: session.type === "personal" && !!recipientAddress && !!contracts,
			staleTime: 60_000,
		});
	const recipientNotReady =
		session.type === "personal" &&
		!checkingRecipient &&
		recipientIsRegistered === false;

	const personalMessages = usePersonalMessages(
		session.type === "personal" && session.walletAddress
			? session.walletAddress
			: undefined,
	);
	const groupMessages = useLearningGroupMessages(
		session.type === "group" ? session.chatId : undefined,
	);

	const messages =
		session.type === "personal" ? personalMessages : groupMessages;
	const isLoading = messages.isLoading;
	const pageMessages = [...(messages.data?.pages ?? [])]
		.reverse()
		.flatMap((p) => [...(p.messages as unknown[])].reverse());

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [pageMessages]);

	const handleSend = () => {
		const trimmed = messageText.trim();
		if (!trimmed) return;
		onSendMessage(trimmed, () => setMessageText(""));
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg flex flex-col">
			{/* Header */}
			<div className="sticky top-0 pt-8 z-40 flex items-center justify-between p-4 md:p-6 border-b border-dark-border bg-dark-surface/40 backdrop-blur-xl">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-dark-border rounded-lg transition"
					>
						<ArrowLeft className="w-5 h-5 text-dark-muted" />
					</button>
					<div>
						<h2 className="font-bold text-dark-text font-montserrat text-lg">
							{resolvedName}
						</h2>
						<p className="text-xs text-dark-muted font-montserrat">
							{session.type === "personal" ? "Direct Message" : "Group Chat"}
						</p>
					</div>
				</div>
			</div>

			{/* Messages Container */}
			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full pb-36 md:pb-6">
				{isLoading ? (
					<div className="flex items-center justify-center h-full min-h-96">
						<Loader className="w-8 h-8 animate-spin text-dark-accent" />
					</div>
				) : pageMessages.length === 0 ? (
					<div className="flex items-center justify-center h-full min-h-96 text-dark-muted">
						<p className="text-sm">No messages yet. Start a conversation!</p>
					</div>
				) : (
					pageMessages.map((msg) => {
						const msgTyped = msg as {
							id?: number;
							senderWallet?: string;
							senderAddress?: string;
							plaintext?: string;
							content?: string;
							createdAt?: string;
						};
						const senderWallet =
							msgTyped.senderWallet ?? msgTyped.senderAddress;
						const isMine =
							senderWallet?.toLowerCase() ===
							wallet?.account.address?.toLowerCase();
						return (
							<div
								key={msgTyped.id}
								className={`flex ${isMine ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-md px-4 py-3 rounded-2xl ${
										isMine
											? "bg-dark-accent text-dark-bg rounded-br-sm"
											: "bg-dark-border text-dark-text rounded-bl-sm"
									}`}
								>
									<p className="text-sm font-montserrat">
										{msgTyped.plaintext || msgTyped.content}
									</p>
									<p className="text-xs opacity-70 mt-2 font-montserrat text-right">
										{msgTyped.createdAt
											? new Date(msgTyped.createdAt).toLocaleTimeString()
											: ""}
									</p>
								</div>
							</div>
						);
					})
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input composer */}
			<div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 border-t border-dark-border bg-dark-surface/95 backdrop-blur-xl z-50 w-full pb-[calc(1rem+env(safe-area-inset-bottom))]">
				<div className="max-w-4xl mx-auto flex flex-col gap-1">
					{keygenNotReady && !keygenError && (
						<div className="flex items-center gap-2 text-xs text-dark-muted font-montserrat px-1 mb-1">
							<Loader className="w-3 h-3 animate-spin shrink-0" />
							{isKeygenPending
								? "Setting up your encryption keys… please wait"
								: "Checking encryption key status…"}
						</div>
					)}
					{keygenError && (
						<p className="text-xs text-red-400 font-montserrat px-1 mb-1">
							Encryption setup failed: {keygenError}
						</p>
					)}
					{recipientNotReady && (
						<p className="text-xs text-amber-400 font-montserrat px-1 mb-1">
							This user hasn't set up encryption yet. They need to open the app
							before you can message them.
						</p>
					)}
					<div className="flex gap-3">
						<input
							type="text"
							placeholder={
								keygenNotReady
									? "Waiting for encryption setup..."
									: recipientNotReady
										? "Recipient can't receive messages yet..."
										: "Type a message..."
							}
							value={messageText}
							onChange={(e) => setMessageText(e.target.value)}
							onKeyDown={(e) =>
								e.key === "Enter" &&
								!isSending &&
								!keygenNotReady &&
								!recipientNotReady &&
								handleSend()
							}
							disabled={isSending || keygenNotReady || recipientNotReady}
							className="flex-1 bg-dark-surface/80 border border-dark-border rounded-xl px-4 py-3 text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-dark-accent/40 font-montserrat disabled:opacity-60"
						/>
						<button
							type="button"
							onClick={handleSend}
							disabled={
								!messageText.trim() ||
								isSending ||
								keygenNotReady ||
								recipientNotReady
							}
							className="bg-dark-accent hover:bg-dark-accent/90 disabled:opacity-50 text-dark-bg px-6 py-3 rounded-xl transition font-semibold font-montserrat"
						>
							{isSending ? (
								<Loader className="w-5 h-5 animate-spin" />
							) : (
								<Send className="w-5 h-5" />
							)}
						</button>
					</div>
					{sendError && (
						<p className="text-xs text-red-400 font-montserrat px-1">
							Failed to send: {sendError}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default function Messages() {
	const search = useSearch({ from: "/messages" });
	const navigate = useNavigate();

	const type = search.type as ChatType;
	const name =
		(search.name as string) ||
		(search.address ? `${(search.address as string).slice(0, 6)}...` : "Chat");

	const session: ChatSession = {
		id: (search.address as string) || String(search.chatId),
		type,
		name,
		walletAddress:
			type === "personal" ? (search.address as Address) : undefined,
		chatId: type === "group" ? Number(search.chatId) : undefined,
	};

	const sendPersonalMessage = useSendPersonalMessage();
	const sendGroupMessage = useSendLearningGroupMessage();

	const handleClose = useCallback(() => {
		navigate({ to: "/social" });
	}, [navigate]);

	const handleSendMessage = useCallback(
		(content: string, onSuccess: () => void) => {
			if (session.type === "personal" && session.walletAddress) {
				sendPersonalMessage.mutate(
					{ recipient: session.walletAddress, message: content },
					{
						onSuccess: (result) => {
							if (result.success) onSuccess();
						},
					},
				);
			} else if (session.type === "group" && session.chatId) {
				sendGroupMessage.mutate(
					{ chatId: session.chatId, content },
					{ onSuccess: () => onSuccess() },
				);
			}
		},
		[session, sendPersonalMessage, sendGroupMessage],
	);

	return (
		<ChatWindow
			session={session}
			onClose={handleClose}
			onSendMessage={handleSendMessage}
			isSending={sendPersonalMessage.isPending || sendGroupMessage.isPending}
			sendError={
				sendPersonalMessage.isError
					? (sendPersonalMessage.error as Error)?.message
					: sendGroupMessage.isError
						? (sendGroupMessage.error as Error)?.message
						: null
			}
		/>
	);
}

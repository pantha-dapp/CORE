import {
	type Account,
	type Chain,
	type Client,
	createPublicClient,
	getContract,
	http,
	type PublicClient,
	type Transport,
	toHex,
	type WalletClient,
} from "viem";
import { definitions } from "../definitions.gen";

function getKeyedClient<T extends Client | WalletClient>(client: T) {
	return {
		public: createPublicClient({
			transport: http(client.chain?.rpcUrls.default.http[0]),
		}),
		wallet: client,
	} as {
		public: PublicClient<Transport, Chain>;
		wallet: WalletClient<Transport, Chain, Account>;
	};
}

export function getContracts<T extends Wallet>(options: {
	client: T;
	chainId: number;
}) {
	const { client, chainId } = options;

	if (!client.transport || !client.chain || !client.account) {
		console.log(
			"Ensure client is properly initialized with transport, chain and account",
		);
	}

	const key = toHex(chainId);
	if (!Object.keys(definitions).includes(key)) {
		console.error(`No contract definitions found for chainId ${chainId}`);
		throw new Error(`Unsupported chainId: ${chainId}`);
	}

	const contractDefinitions = definitions[key as keyof typeof definitions];
	const keyedClient = getKeyedClient(client);

	return {
		PanthaOrchestrator: getContract({
			client: keyedClient,
			...contractDefinitions.PanthaOrchestrator,
		}),
		PXP: getContract({
			client: keyedClient,
			...contractDefinitions.PXP,
		}),
		PanthaCertificate: getContract({
			client: keyedClient,
			...contractDefinitions.PanthaCertificate,
		}),
		PanthaKeyStore: getContract({
			client: keyedClient,
			...contractDefinitions.PanthaKeyStore,
		}),
		PanthaCertificationAuthority: getContract({
			client: keyedClient,
			...contractDefinitions.PanthaCertificationAuthority,
		}),
		PanthaToken: getContract({
			client: keyedClient,
			...contractDefinitions.PanthaToken,
		}),
		$client: client,
		$publicClient: keyedClient.public,
	};
}

export type PanthaContracts = ReturnType<typeof getContracts>;

type Wallet = WalletClient<Transport, Chain, Account>;

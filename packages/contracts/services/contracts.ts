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
import { definitions } from "../definitions";

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

	return {
		PanthaOrchestrator: getContract({
			client: getKeyedClient(client),
			...contractDefinitions.PanthaOrchestrator,
		}),
		PXP: getContract({
			client: getKeyedClient(client),
			...contractDefinitions.PXP,
		}),
		PanthaCertificate: getContract({
			client: getKeyedClient(client),
			...contractDefinitions.PanthaCertificate,
		}),
		PanthaKeyStore: getContract({
			client: getKeyedClient(client),
			...contractDefinitions.PanthaKeyStore,
		}),
		PanthaCertificationAuthority: getContract({
			client: getKeyedClient(client),
			...contractDefinitions.PanthaCertificationAuthority,
		}),
		PanthaToken: getContract({
			client: getKeyedClient(client),
			...contractDefinitions.PanthaToken,
		}),
		$client: client,
	};
}

export type PanthaContracts = ReturnType<typeof getContracts>;

type Wallet = WalletClient<Transport, Chain, Account>;

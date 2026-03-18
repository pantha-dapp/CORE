import {
	type Account,
	type Chain,
	createPublicClient,
	createWalletClient,
	getContract,
	http,
	type PublicClient,
	type Transport,
	testActions,
	toHex,
	type WalletClient,
} from "viem";
import { definitions } from "../definitions.gen";

export function getContracts<T extends Wallet>(options: {
	client: T;
	chain: Chain;
}) {
	const { client } = options;

	const chain = options.chain ? options.chain : client.chain;

	function getKeyedClient() {
		return {
			public: createPublicClient({
				transport: http(chain?.rpcUrls.default.http[0]),
				chain: chain,
			}),
			wallet: createWalletClient({
				transport: http(chain?.rpcUrls.default.http[0]),
				account: client.account,
				chain: chain,
			}),
		} as {
			public: PublicClient<Transport, Chain>;
			wallet: WalletClient<Transport, Chain, Account>;
		};
	}

	if (!client.transport || !client.chain || !client.account) {
		console.log(
			"Ensure client is properly initialized with transport, chain and account",
		);
	}

	const key = toHex(chain.id);

	if (!Object.keys(definitions).includes(key)) {
		console.error(`No contract definitions found for chainId ${chain.id}`);
		throw new Error(`Unsupported chain: ${chain.name}`);
	}

	const contractDefinitions = definitions[key as keyof typeof definitions];
	const keyedClient = getKeyedClient();

	const testClient = client.extend(testActions({ mode: "hardhat" }));

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
		PanthaShop: getContract({
			client: keyedClient,
			...contractDefinitions.PanthaShop,
		}),
		PanthaTreasury: getContract({
			client: keyedClient,
			...contractDefinitions.PanthaTreasury,
		}),
		$client: client,
		$publicClient: keyedClient.public,
		$$testClient: testClient,
	};
}

export type PanthaContracts = ReturnType<typeof getContracts>;

type Wallet = WalletClient<Transport, Chain, Account>;

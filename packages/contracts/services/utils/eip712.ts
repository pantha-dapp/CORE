import type { SignTypedDataParameters } from "viem";
import type { PanthaContracts } from "../contracts";

export async function eip712signature(
	contracts: PanthaContracts,
	contractName: keyof Pick<
		PanthaContracts,
		"PanthaKeyStore" | "PanthaShop" | "PanthaToken"
	>,
	args: Omit<SignTypedDataParameters, "domain" | "privateKey" | "account">,
) {
	// const domain = {
	// 	name: contractName,
	// 	version: "1",
	// 	chainId: contracts.$client.chain.id,
	// 	verifyingContract: contracts[contractName].address,
	// };

	const domain = {
		name: contractName,
		version: "1",
		chainId: contracts.$publicClient.chain.id,
		verifyingContract: contracts[contractName].address,
	};

	return contracts.$client.signTypedData({
		domain,
		account: contracts.$client.account,
		...args,
	});
}

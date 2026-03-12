export async function eip712signature(
	contracts: FilosignContracts,
	contractName: keyof Pick<
		FilosignContracts,
		"FSFileRegistry" | "FSKeyRegistry"
	>,
	args: Omit<SignTypedDataParameters, "domain" | "privateKey">,
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
		chainId: contracts.$client.chain.id,
		verifyingContract: contracts[contractName].address,
	};

	return contracts.$client.signTypedData({
		domain,
		...args,
	});
}

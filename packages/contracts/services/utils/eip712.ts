import { SignTypedDataParameters } from "viem";
import { PanthaContracts } from "../contracts";

export async function eip712signature(
    contracts: PanthaContracts,
    contractName: keyof Pick<
        PanthaContracts,
        "PanthaOrchestrator"
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

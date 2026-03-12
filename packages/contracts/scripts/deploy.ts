import { $ } from "bun";
import hre from "hardhat";
import { toHex } from "viem";

const DEFINITIONS_FILE_PREFIX = "export const definitions = ";
const DEFINITIONS_FILE_SUFFIX = " as const;";

const network = await hre.network.connect("flowEvmTestnet")
const { viem } = network;
const [deployer] = await viem.getWalletClients();

async function main() {
    const chainId = network.networkConfig.chainId;
    if (!chainId) {
        console.error(
            "No chainId found in network config, how will we deploy to this network?",
        );
        process.exit(1);
    }


    console.log("Deploying contracts as ", deployer.account.address);

    const panthaToken = await viem.deployContract("PanthaToken", [BigInt(100_000_000 * (10 ** 18))]);
    const orchestrator = await viem.deployContract("PanthaOrchestrator", [panthaToken.address]);
    const certificationAuthority = await viem.getContractAt(
        "PanthaCertificationAuthority",
        await orchestrator.read.certificationAuthority(),
    );
    const keyStore = await viem.getContractAt(
        "PanthaKeyStore",
        await orchestrator.read.keyStore(),
    );
    const pxp = await viem.getContractAt("PXP", await orchestrator.read.pxp());
    const certificate = await viem.getContractAt("PanthaCertificate", await certificationAuthority.read.certificate());

    console.log("Contracts deployed");

    const definitions = {
        PanthaOrchestrator: {
            address: orchestrator.address,
            abi: orchestrator.abi,
        },
        PanthaCertificate: {
            address: certificate.address,
            abi: certificate.abi,
        },
        PanthaKeyStore: {
            address: keyStore.address,
            abi: keyStore.abi,
        },
        PanthaCertificationAuthority: {
            address: certificationAuthority.address,
            abi: certificationAuthority.abi,
        },
        PanthaToken: {
            address: panthaToken.address,
            abi: panthaToken.abi,
        },
        PXP: {
            address: pxp.address,
            abi: pxp.abi,
        }
    } as const;

    let existingDefinitions: Record<string, typeof definitions> = {};

    const definitionsFile = Bun.file("definitions.ts");
    try {
        const existingContent = await definitionsFile.text();

        // Validate file format before parsing
        if (
            existingContent.startsWith(DEFINITIONS_FILE_PREFIX) &&
            existingContent.endsWith(DEFINITIONS_FILE_SUFFIX)
        ) {
            const definitionsJson = existingContent.slice(
                DEFINITIONS_FILE_PREFIX.length,
                existingContent.length - DEFINITIONS_FILE_SUFFIX.length,
            );
            existingDefinitions = JSON.parse(definitionsJson);
        }
    } catch (error) {
        console.error("Error reading definitions.ts:", error);
        // Reset to empty object if parsing fails
        existingDefinitions = {};
    }

    // Always add the new definitions, even if parsing failed
    existingDefinitions[toHex(chainId)] = definitions;

    await definitionsFile.write(
        DEFINITIONS_FILE_PREFIX +
        JSON.stringify(existingDefinitions, null, 2) +
        DEFINITIONS_FILE_SUFFIX,
    );

    console.log("Definitions written to definitions.ts");
    if (chainId === 545) {
        try {
            await $`bunx --bun hardhat verify --network flowEvmTestnet ${orchestrator.address} --force`;
            await sleep(1000);
            await $`bunx --bun hardhat verify --network flowEvmTestnet ${certificate.address} --force`;
            await sleep(1500);
            await $`bunx --bun hardhat verify --network flowEvmTestnet ${keyStore.address} --force`;
            await sleep(1500);
            await $`bunx --bun hardhat verify --network flowEvmTestnet ${certificationAuthority.address} --force`;
            await sleep(1500);
            await $`bunx --bun hardhat verify --network flowEvmTestnet ${pxp.address} --force`;
            await sleep(1500);
            await $`bunx --bun hardhat verify --network flowEvmTestnet ${panthaToken.address} --force`;
        } catch (_) { }
        console.log("Contracts verified on flowEvmTestnet block explorer");
    }
}

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
    .then(() => console.log("Deployment script finished"))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });

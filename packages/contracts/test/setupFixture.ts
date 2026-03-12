import { network } from "hardhat";

export async function setupFixture() {
	const { viem } = await network.connect();
	const [owner, user] = await viem.getWalletClients();
	const publicClient = await viem.getPublicClient();

	const token = await viem.deployContract("PanthaToken", [
		BigInt(100 * 10 ** 18),
	]);
	const orchestrator = await viem.deployContract("PanthaOrchestrator", [
		token.address,
	]);
	const pxpAddress = await orchestrator.read.pxp();
	const _pxp = await viem.getContractAt("PXP", pxpAddress);
	const _ca = await orchestrator.read.certificationAuthority();

	return {
		viem,
		token,
		owner,
		user,
		publicClient,
	};
}

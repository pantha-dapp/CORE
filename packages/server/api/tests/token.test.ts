import { afterAll, describe, expect, it, setSystemTime } from "bun:test";
import { testGlobals } from "./helpers/globals";
// import { unwrap } from "./helpers/rpc";
import { userWallet1 } from "./helpers/setup";

describe("Pantha Token", async () => {
	afterAll(async () => {
		setSystemTime();
		await testGlobals.reauthenticate();
	});

	it("should drip $PANTHA from the faucet", async () => {
		const { api1, contracts } = testGlobals;

		const balanceBefore = await contracts.PanthaToken.read.balanceOf([
			userWallet1.account.address,
		]);

		const response = await api1.faucet.pantha.$post({
			query: { address: userWallet1.account.address },
		});
		if (!response.ok) {
			throw new Error("Failed to claim from faucet");
		}
		const parsed = await response.json();

		if (!parsed.success) {
			throw new Error("Faucet request was not successful");
		}
		const data = parsed.data;

		if (!data.claimed) {
			throw new Error(`Expected to claim tokens`);
		}
		const { txHash: hash } = data;
		expect(hash).toBeTruthy();

		expect(data.claimed).toBe(true);
		await contracts.$publicClient.waitForTransactionReceipt({ hash });
		const balanceAfter = await contracts.PanthaToken.read.balanceOf([
			userWallet1.account.address,
		]);

		expect(balanceAfter).toBeGreaterThan(balanceBefore);
	});

	it("must reject before the next claim is available", async () => {
		const { api1 } = testGlobals;
		const response = await api1.faucet.pantha.$post({
			query: { address: userWallet1.account.address },
		});

		if (!response.ok) {
			throw new Error("Failed to claim from faucet");
		}
		const parsed = await response.json();

		if (parsed.success) {
			expect(parsed.data.claimed).toBe(false);
		} else {
			expect(parsed.error).toBeDefined();
		}
	});

	it("should allow claiming again after the cooldown", async () => {
		setSystemTime(Date.now() + 25 * 60 * 60 * 1000);
		await testGlobals.reauthenticate();
		const { api1 } = testGlobals;

		const response = await api1.faucet.pantha.$post({
			query: { address: userWallet1.account.address },
		});
		const parsed = await response.json();

		if (!parsed.success) {
			throw new Error("Faucet claim was not successful after cooldown");
		}
		const data = parsed.data;

		if (!data.claimed) {
			throw new Error(`Expected to claim tokens after cooldown`);
		}
		const { txHash: hash } = data;
		expect(hash).toBeTruthy();
	});
});

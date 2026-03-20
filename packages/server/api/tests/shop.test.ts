import { beforeAll, describe, expect, it } from "bun:test";
import { eip712signature } from "@pantha/contracts";
import { testGlobals } from "./helpers/globals";
import { unwrap } from "./helpers/rpc";
import { userWallet1 } from "./helpers/setup";

describe("Shop behavir", async () => {
	beforeAll(async () => {
		const { api1 } = testGlobals;

		await api1.faucet.pantha.$post({
			query: {
				address: userWallet1.account.address,
			},
		});
	});

	async function getItems() {
		const { api1 } = testGlobals;
		const res = await unwrap(api1.shop.$get());
		return res.items;
	}

	it("must fetch avaialble items for purcahse", async () => {
		const items = await getItems();
		expect(items.length).toBeGreaterThan(0);
	});

	it("Can buy items", async () => {
		const { api1, contracts1 } = testGlobals;
		const items = await getItems();
		const item = items[0];

		// Fetch the current nonce for the user from the PanthaToken contract
		const currentNonce = await contracts1.PanthaToken.read.nonces([
			userWallet1.account.address,
		]);

		const signature = await eip712signature(contracts1, "PanthaToken", {
			types: {
				Permit: [
					{ name: "owner", type: "address" },
					{ name: "spender", type: "address" },
					{ name: "value", type: "uint256" },
					{ name: "nonce", type: "uint256" },
					{ name: "deadline", type: "uint256" },
				],
			},
			primaryType: "Permit",
			message: {
				owner: userWallet1.account.address,
				spender: contracts1.PanthaShop.address,
				value: item.priceHuman * 10 ** 18,
				nonce: Number(currentNonce),
				deadline: Math.floor(Date.now() / 1000) + 3600,
			},
		});
		const res = await unwrap(
			api1.shop.buy.$post({
				query: {
					itemId: item.id,
					deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
					signature,
				},
			}),
		);

		expect(res.txHash).toBeTruthy();
	});

	it("Cannot buy items with invalid signature", async () => {
		const { api1 } = testGlobals;
		const items = await getItems();
		const item = items[0];

		const res = await api1.shop.buy.$post({
			query: {
				itemId: item.id,
				deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
				signature: `0x${"00".repeat(65)}`, // Invalid signature
			},
		});

		expect(res.status).toBe(409);
	});
});

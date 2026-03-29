import { beforeAll, describe, expect, it } from "bun:test";
import { eip712signature } from "@pantha/contracts";
import { and, eq, inArray } from "drizzle-orm";
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

	it("shop items list includes CERTIFCT", async () => {
		const items = await getItems();
		const cert = items.find((i) => i.id === "CERTIFCT");
		expect(cert).toBeDefined();
		expect(cert?.priceHuman).toBeGreaterThan(0);
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

		await Bun.sleep(500);
		const res = await api1.shop.buy.$post({
			query: {
				itemId: item.id,
				deadline: (Math.floor(Date.now() / 1000) + 3600).toString(),
				signature: `0x${"00".repeat(65)}`, // Invalid signature
			},
		});

		expect(res.status).toBe(409);
	});

	describe("CERTIFCT item", () => {
		async function buyCertifct() {
			const { api1, contracts1 } = testGlobals;
			const items = await getItems();
			const item = items.find((i) => i.id === "CERTIFCT");
			if (!item) throw new Error("CERTIFCT item not found in shop");

			const nonce = await contracts1.PanthaToken.read.nonces([
				userWallet1.account.address,
			]);
			const deadline = Math.floor(Date.now() / 1000) + 3600;

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
					nonce: Number(nonce),
					deadline,
				},
			});

			return api1.shop.buy.$post({
				query: { itemId: "CERTIFCT", deadline: deadline.toString(), signature },
			});
		}

		it("can purchase CERTIFCT when none is owned", async () => {
			const res = await buyCertifct();
			// Wait for the on-chain tx to settle so the purchase is recorded
			await Bun.sleep(1000);
			expect([200, 201]).toContain(res.status);
		});

		it("cannot purchase CERTIFCT again while one is unconsumed", async () => {
			// The previous test already purchased one; try again without consuming it
			const res = await buyCertifct();
			expect(res.status).toBe(409);
		});
	});

	describe("XP multiplier items", () => {
		const MULTIPLIER_IDS = ["XPMLT150", "XPMLT200", "XPMLT300"];

		/** Bypass the 24-hour faucet cooldown for userWallet1 by deleting the Redis key. */
		async function bustFaucetCooldown() {
			const { appState } = testGlobals;
			const key = `faucet:last-claim${appState.contracts.PanthaToken.address}:${userWallet1.account.address.toLowerCase()}`;
			await appState.db.redis.del(key);
		}

		/** Move all multiplier purchases to 2+ days ago: no active boost, no daily count. */
		async function clearAllBoosts() {
			const { db } = testGlobals.appState;
			await db
				.update(db.schema.userPurchases)
				.set({ purchasedAt: new Date(Date.now() - 49 * 60 * 60 * 1000) })
				.where(
					and(
						eq(db.schema.userPurchases.userWallet, userWallet1.account.address),
						inArray(db.schema.userPurchases.itemId, MULTIPLIER_IDS),
					),
				);
		}

		async function buyBoostItem(itemId: string) {
			const { api1, contracts1 } = testGlobals;
			const { items } = await unwrap(api1.shop.$get());
			const item = items.find((i) => i.id === itemId);
			if (!item) throw new Error(`${itemId} not found in shop`);

			const nonce = await contracts1.PanthaToken.read.nonces([
				userWallet1.account.address,
			]);
			const deadline = Math.floor(Date.now() / 1000) + 3600;
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
					nonce: Number(nonce),
					deadline,
				},
			});

			return api1.shop.buy.$post({
				query: { itemId, deadline: deadline.toString(), signature },
			});
		}

		it("shop listing includes all three XP boost items", async () => {
			const { items } = await unwrap(testGlobals.api1.shop.$get());
			expect(items.find((i) => i.id === "XPMLT150")).toBeDefined();
			expect(items.find((i) => i.id === "XPMLT200")).toBeDefined();
			expect(items.find((i) => i.id === "XPMLT300")).toBeDefined();
		});

		it("can purchase XPMLT150 (1.5x boost)", async () => {
			await clearAllBoosts();
			await bustFaucetCooldown();
			await testGlobals.api1.faucet.pantha.$post({
				query: { address: userWallet1.account.address },
			});

			const res = await buyBoostItem("XPMLT150");
			await Bun.sleep(1000);
			expect([200, 201]).toContain(res.status);
		});

		it("can purchase XPMLT200 (2x boost)", async () => {
			await clearAllBoosts();
			await bustFaucetCooldown();
			await testGlobals.api1.faucet.pantha.$post({
				query: { address: userWallet1.account.address },
			});

			const res = await buyBoostItem("XPMLT200");
			await Bun.sleep(1000);
			expect([200, 201]).toContain(res.status);
		});

		it("can purchase XPMLT300 (3x boost)", async () => {
			await clearAllBoosts();
			await bustFaucetCooldown();
			await testGlobals.api1.faucet.pantha.$post({
				query: { address: userWallet1.account.address },
			});

			const res = await buyBoostItem("XPMLT300");
			await Bun.sleep(1000);
			expect([200, 201]).toContain(res.status);
		});
	});
});

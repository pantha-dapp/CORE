import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { zeroAddress } from "viem";
import { testGlobals } from "./helpers/globals";
import { userWallet1, userWallet2 } from "./helpers/setup";
import { testBecomeFriends } from "./helpers/testHelpers";

const CIPHERTEXT = "0xdeadbeef";

describe("Direct Messages", () => {
	beforeAll(async () => {
		const { api1, api2, appState } = testGlobals;
		// Reset friendship state
		await api1.users.unfollow.$post({
			json: { walletToUnfollow: userWallet2.account.address },
		});
		await api2.users.unfollow.$post({
			json: { walletToUnfollow: userWallet1.account.address },
		});
		// Reset user2's messagePolicy to default
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "friends" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);
	});

	it("unauthenticated user cannot send DM", async () => {
		const { api0 } = testGlobals;
		const res = await api0.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(res.status).toBe(401);
	});

	it("cannot DM non-existent user", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.dm.$post({
			json: { ciphertext: CIPHERTEXT, recipientWallet: zeroAddress },
		});
		expect(res.status).toBe(404);
		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it("cannot DM self", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet1.account.address,
			},
		});
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it("cannot DM user whose messagePolicy is 'noone'", async () => {
		const { api1, appState } = testGlobals;
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "noone" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);

		const res = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it("cannot DM user whose messagePolicy is 'friends' when not friends", async () => {
		const { api1, appState } = testGlobals;
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "friends" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);

		const res = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it("can DM user whose messagePolicy is 'anyone'", async () => {
		const { api1, appState } = testGlobals;
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "anyone" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);

		const postRes = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(postRes.status).toBe(201);

		const getRes = await api1.users.social.dm.$get({
			query: { participantWallet: userWallet2.account.address },
		});
		expect(getRes.status).toBe(200);
		const data = await getRes.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		const match = data.data.messages.find((m) => m.ciphertext === CIPHERTEXT);
		expect(match).toBeDefined();
		if (!match) throw new Error("Expected message not found");
		expect(match.senderWallet).toBe(userWallet1.account.address);
		expect(match.recipientWallet).toBe(userWallet2.account.address);
	});

	it("can DM a friend when messagePolicy is 'friends'", async () => {
		const { api1, api2, appState } = testGlobals;
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "friends" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);
		await testBecomeFriends(api1, api2);

		const postRes = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(postRes.status).toBe(201);

		const getRes = await api1.users.social.dm.$get({
			query: { participantWallet: userWallet2.account.address },
		});
		expect(getRes.status).toBe(200);
		const data = await getRes.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		const match = data.data.messages.find((m) => m.ciphertext === CIPHERTEXT);
		expect(match).toBeDefined();
		if (!match) throw new Error("Expected message not found");
		expect(match.senderWallet).toBe(userWallet1.account.address);
		expect(match.recipientWallet).toBe(userWallet2.account.address);
	});
});

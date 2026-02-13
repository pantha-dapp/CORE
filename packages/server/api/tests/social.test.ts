import { describe, expect, it } from "bun:test";
import { zeroAddress } from "viem";
import { testGlobals } from "./helpers/globals";
import { userWallet1, userWallet2 } from "./helpers/setup";

describe("Following Users", () => {
	it("can fetch empty followers and following", async () => {
		const { api1 } = testGlobals;
		const followersRes = await api1.users[":wallet"].followers.$get({
			param: { wallet: userWallet2.account.address },
		});
		const followingRes = await api1.users[":wallet"].following.$get({
			param: { wallet: userWallet1.account.address },
		});
		const followersData = await followersRes.json();
		const followingData = await followingRes.json();

		if (!followersData.success || !followingData.success) {
			throw new Error("Failed to fetch followers or following");
		}

		expect(followersData.data.followers).toEqual([]);
		expect(followingData.data.following).toEqual([]);
	});

	it("can follow user", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.follow.$post({
			json: {
				walletToFollow: userWallet2.account.address,
			},
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it("followed user shows up in self following", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users[":wallet"].following.$get({
			param: { wallet: userWallet1.account.address },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch following");
		}
		expect(data.data.following).toEqual([userWallet2.account.address]);
	});

	it("follower user shows up in followers", async () => {
		const { api2 } = testGlobals;
		const res = await api2.users[":wallet"].followers.$get({
			param: { wallet: userWallet2.account.address },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch followers");
		}
		expect(data.data.followers).toEqual([userWallet1.account.address]);
	});

	it("Follows are idempotent", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.follow.$post({
			json: {
				walletToFollow: userWallet2.account.address,
			},
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);

		const followersRes = await api1.users[":wallet"].followers.$get({
			param: { wallet: userWallet2.account.address },
		});
		const followersData = await followersRes.json();
		if (!followersData.success) {
			throw new Error("Failed to fetch followers");
		}

		expect(followersData.data.followers).toEqual([userWallet1.account.address]);
	});

	it("Can not follow self", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.follow.$post({
			json: {
				walletToFollow: userWallet1.account.address,
			},
		});
		const data = await res.json();
		expect(res.status).toBe(400);
		expect(data.success).toBe(false);
	});

	it("Can unfollow user", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.unfollow.$post({
			json: {
				walletToUnfollow: userWallet2.account.address,
			},
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it("unfollowed user no longer shows up in self following", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users[":wallet"].following.$get({
			param: { wallet: userWallet1.account.address },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch following");
		}
		expect(data.data.following).toEqual([]);
	});

	it("unfollower user no longer shows up in followers", async () => {
		const { api2 } = testGlobals;
		const res = await api2.users[":wallet"].followers.$get({
			param: { wallet: userWallet2.account.address },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch followers");
		}
		expect(data.data.followers).toEqual([]);
	});

	it("Can not follow non-existent user", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.follow.$post({
			json: {
				walletToFollow: zeroAddress,
			},
		});
		const data = await res.json();
		expect(res.status).toBe(404);
		expect(data.success).toBe(false);
	});
});

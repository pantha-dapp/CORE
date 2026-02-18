import { describe, expect, it } from "bun:test";
import { testGlobals } from "./helpers/globals";
import { userWallet1, userWallet2 } from "./helpers/setup";

describe("Auth", () => {
	it("runtime returns uptime", async () => {
		const { api0 } = testGlobals;
		const res = await api0.runtime.$get();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.uptime).toBeNumber();
	});

	it("unauthenticated user is not validated", async () => {
		const { api0 } = testGlobals;
		const res = await api0.auth.validate.$get();
		expect(res.json).toThrow();
		expect(res.status).toBe(401);
	});

	it("authenticated user is validated", async () => {
		const { api1 } = testGlobals;
		const res = await api1.auth.validate.$get();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it("Can fetch self info", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users[":wallet"].$get({
			param: { wallet: userWallet1.account.address },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch user info");
		}
		expect(data.data.user.walletAddress).toBe(userWallet1.account.address);
	});
	it("Can fetch other user's info", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users[":wallet"].$get({
			param: { wallet: userWallet2.account.address },
		});
		const data = await res.json();
		expect(res.status).toBe(200);
		if (!data.success) {
			throw new Error("Failed to fetch user info");
		}
		expect(data.data.user.walletAddress).toBe(userWallet2.account.address);
	});
});

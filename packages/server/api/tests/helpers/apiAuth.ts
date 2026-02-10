import { hc } from "hono/client";
import type { Account, Chain, createWalletClient, Transport } from "viem";
import { createSiweMessage } from "viem/siwe";
import type { apiRouter } from "../../routes/router";

export async function createAuthenticatedApi(
	testApi: typeof apiRouter,
	wallet: ReturnType<typeof createWalletClient<Transport, Chain, Account>>,
) {
	// Create unauthenticated client first to get nonce
	const unauthApi = hc<typeof apiRouter>("http://localhost", {
		fetch: async (input: string, init: RequestInit | undefined) => {
			const request = new Request(input, init);
			return testApi.fetch(request);
		},
	});

	const nonceRes = await unauthApi.auth.nonce.$get({
		query: { address: wallet.account.address },
	});
	const nonceData = await nonceRes.json();
	if (!nonceData.success) {
		throw new Error("Failed to get nonce");
	}

	const message = createSiweMessage({
		address: wallet.account.address,
		chainId: wallet.chain.id,
		domain: "127.0.0.1",
		nonce: nonceData.data.nonce,
		uri: "http://127.0.0.1",
		version: "1",
	});

	const signature = await wallet.signMessage({
		message,
	});

	const verifyRes = await unauthApi.auth.verify.$post({
		json: {
			message,
			signature,
		},
	});

	const verifyData = await verifyRes.json();

	if (!verifyData.success || !verifyData.data.token) {
		throw new Error("Failed to verify SIWE message");
	}

	// Create authenticated client with token
	return hc<typeof apiRouter>("http://localhost", {
		fetch: async (input: string, init: RequestInit | undefined) => {
			const request = new Request(input, init);
			return testApi.fetch(request);
		},
		headers: {
			Authorization: `Bearer ${verifyData.data.token}`,
		},
	});
}

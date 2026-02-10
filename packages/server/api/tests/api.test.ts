import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { QdrantClient } from "@qdrant/js-client-rest";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { hc } from "hono/client";
import {
	GenericContainer,
	type StartedTestContainer,
	Wait,
} from "testcontainers";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { createAi } from "../../lib/ai";
import { createDb } from "../../lib/db";
import { apiRouter } from "../routes/router";
import { testAiAdapter } from "./helpers/testAiAdapter";

let api: ReturnType<typeof hc<typeof apiRouter>>;

// let container: GenericContainer;
const TEST_QDRANT_PORT = 6332;
let container: StartedTestContainer;

const userWallet1 = createWalletClient({
	account: privateKeyToAccount(
		"0x7b9a333cc8f8558f744fd43bae30c1cf9e33e3f5b1a9e8ca3402edec728dde84",
	),
	transport: http(),
	chain: hardhat,
});
const userWallet2 = createWalletClient({
	account: privateKeyToAccount(
		"0x7b9a333cc8f8558f744fd43bae30c1cf9e33e3f5b1a9e8ca3402edec728dde75",
	),
	transport: http(),
	chain: hardhat,
});

afterAll(async () => {
	await container?.stop();
});

beforeAll(async () => {
	container = await new GenericContainer("qdrant/qdrant")
		.withExposedPorts(TEST_QDRANT_PORT)
		.withWaitStrategy(Wait.forHttp("/collections", TEST_QDRANT_PORT))
		.start();

	const testVecDb = new QdrantClient({
		host: "localhost",
		port: container.getMappedPort(TEST_QDRANT_PORT),
	});
	const testDb = createDb(":memory:", testVecDb);

	migrate(testDb.$db, {
		migrationsFolder: "./drizzle",
	});

	const testApi = apiRouter.use("*", async (ctx, next) => {
		ctx.set("db", testDb);
		ctx.set(
			"ai",
			createAi({
				aiClient: testAiAdapter,
				vectorDbClient: testVecDb,
			}),
		);
		await next();
	});

	api = hc<typeof apiRouter>("", {
		fetch: (req: unknown) => testApi.request(req),
	});

	const nonceRes = await api.auth.nonce.$get({
		query: { address: userWallet1.account.address },
	});
	const nonceData = await nonceRes.json();
	if (!nonceData.success) {
		throw new Error("Failed to get nonce");
	}

	const message = createSiweMessage({
		address: userWallet1.account.address,
		chainId: userWallet1.chain.id,
		domain: "http://localhost",
		nonce: nonceData.data.nonce,
		uri: "http://localhost",
		version: "1",
	});
	const signature = await userWallet1.signMessage({
		message,
	});

	const verifyRes = await api.auth.verify.$post({
		json: {
			message,
			signature,
		},
	});
	const verifyData = await verifyRes.json();

	if (!verifyData.success || !verifyData.data.token) {
		throw new Error("Failed to verify SIWE message");
	}

	api = hc<typeof apiRouter>("", {
		fetch: (req: unknown) => testApi.request(req),
		headers: {
			Authorization: `Bearer ${verifyData.data.token}`,
		},
	});
});

describe("API", () => {
	it("runtime returns uptime", async () => {
		const res = await api.runtime.$get();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.uptime).toBeNumber();
	});

	it("authenticated", async () => {
		const res = await api.auth.validate.$get();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
	});
});

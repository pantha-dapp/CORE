import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
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

let qdrant: StartedTestContainer;
let redis: StartedTestContainer;

const userWallet1 = createWalletClient({
	account: privateKeyToAccount(
		"0x7b9a333cc8f8558f744fd43bae30c1cf9e33e3f5b1a9e8ca3402edec728dde84",
	),
	transport: http(),
	chain: hardhat,
});
const _userWallet2 = createWalletClient({
	account: privateKeyToAccount(
		"0x7b9a333cc8f8558f744fd43bae30c1cf9e33e3f5b1a9e8ca3402edec728dde75",
	),
	transport: http(),
	chain: hardhat,
});

beforeAll(async () => {
	qdrant = await new GenericContainer("qdrant/qdrant")
		.withExposedPorts(6333)
		.withWaitStrategy(Wait.forHttp("/collections", 6333))
		.start();

	const testVecDb = new QdrantClient({
		host: "localhost",
		port: qdrant.getMappedPort(6333),
	});

	redis = await new GenericContainer("redis:7-alpine")
		.withExposedPorts(6379)
		.withWaitStrategy(Wait.forLogMessage("* Ready to accept connections"))
		.start();
	const testRedis = new RedisClient(
		`redis://localhost:${redis.getMappedPort(6379)}`,
		{ maxRetries: 3 },
	);

	const testDb = createDb(":memory:", {
		vectorDbClient: testVecDb,
		redisClient: testRedis,
	});

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
		domain: "127.0.0.1",
		nonce: nonceData.data.nonce,
		uri: "http://127.0.0.1",
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

afterAll(async () => {
	await qdrant.stop();
	await redis.stop();
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

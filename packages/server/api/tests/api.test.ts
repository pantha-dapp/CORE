import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { QdrantClient } from "@qdrant/js-client-rest";
import { RedisClient } from "bun";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Hono } from "hono";
import { hc } from "hono/client";
import {
	GenericContainer,
	type StartedTestContainer,
	Wait,
} from "testcontainers";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";
import { createAi } from "../../lib/ai";
import { createDb } from "../../lib/db";
import { InMemoryEventBus } from "../../lib/events/bus";
import { apiRouter } from "../routes/router";
import type { RouterEnv } from "../routes/types";
import { createAuthenticatedApi } from "./helpers/apiAuth";
import { testAiAdapter } from "./helpers/testAiAdapter";

let api0: ReturnType<typeof hc<typeof apiRouter>>;
let api1: ReturnType<typeof hc<typeof apiRouter>>;
let api2: ReturnType<typeof hc<typeof apiRouter>>;

let qdrant: StartedTestContainer;
let redis: StartedTestContainer;

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

beforeAll(
	async () => {
		qdrant = await new GenericContainer("qdrant/qdrant")
			.withExposedPorts(6333)
			.withWaitStrategy(Wait.forHttp("/collections", 6333))
			.start();

		const testVecDb = new QdrantClient({
			host: "localhost",
			port: qdrant.getMappedPort(6333),
			checkCompatibility: false,
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

		const testApi = new Hono<RouterEnv>()
			.use("*", async (ctx, next) => {
				ctx.set("db", testDb);
				ctx.set(
					"ai",
					createAi({
						aiClient: testAiAdapter,
						vectorDbClient: testVecDb,
					}),
				);
				ctx.set("eventBus", new InMemoryEventBus());

				await next();
			})
			.route("/", apiRouter);

		api0 = hc<typeof apiRouter>("http://localhost", {
			fetch: async (input: string, init: RequestInit | undefined) => {
				const request = new Request(input, init);
				return testApi.fetch(request);
			},
		});

		api1 = await createAuthenticatedApi(testApi, userWallet1);
		api2 = await createAuthenticatedApi(testApi, userWallet2);
	},
	{ timeout: 20_000 },
);

afterAll(async () => {
	await qdrant.stop();
	await redis.stop();
});

describe("Auth", () => {
	it("runtime returns uptime", async () => {
		const res = await api0.runtime.$get();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.uptime).toBeNumber();
	});

	it("unauthenticated user is not validated", async () => {
		const res = await api0.auth.validate.$get();
		expect(res.json).toThrow();
		expect(res.status).toBe(401);
	});

	it("authenticated user is validated", async () => {
		const res = await api1.auth.validate.$get();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
	});

	it("Can fetch self info", async () => {
		const res = await api1.users.me.$get();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.data.walletAddress).toBe(userWallet1.account.address);
	});
	it("Can fetch other user's info", async () => {
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

describe("Following", () => {
	it("can fetch empty followers and following", async () => {
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
});

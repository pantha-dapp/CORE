import { afterAll, beforeAll } from "bun:test";
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
import { createAi } from "../../../lib/ai";
import { createDb } from "../../../lib/db";
import { InMemoryEventBus } from "../../../lib/events/bus";
import { registerEventHandlers } from "../../../lib/events/handlers";
import { apiRouter } from "../../routes/router";
import type { AppState, RouterEnv } from "../../routes/types";
import { createAuthenticatedApi } from "./apiAuth";
import { testGlobals } from "./globals";
import { testAiAdapter } from "./testAiAdapter";

// let api0 = hc<typeof apiRouter>("http://error");
// let api1 = hc<typeof apiRouter>("http://error");
// let api2 = hc<typeof apiRouter>("http://error");

export const userWallet1 = createWalletClient({
	account: privateKeyToAccount(
		"0x7b9a333cc8f8558f744fd43bae30c1cf9e33e3f5b1a9e8ca3402edec728dde84",
	),
	transport: http(),
	chain: hardhat,
});
export const userWallet2 = createWalletClient({
	account: privateKeyToAccount(
		"0x7b9a333cc8f8558f744fd43bae30c1cf9e33e3f5b1a9e8ca3402edec728dde75",
	),
	transport: http(),
	chain: hardhat,
});
let qdrant: StartedTestContainer;
let redis: StartedTestContainer;

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

		const testEventBus = new InMemoryEventBus();

		const appState: AppState = {
			db: testDb,
			ai: createAi({
				aiClient: testAiAdapter,
				vectorDbClient: testVecDb,
			}),
			eventBus: testEventBus,
		};

		registerEventHandlers(appState);

		const testApi = new Hono<RouterEnv>()
			.use("*", async (ctx, next) => {
				ctx.set("appState", appState);

				await next();
			})
			.route("/", apiRouter);

		testGlobals.api0 = hc<typeof apiRouter>("http://localhost", {
			fetch: async (input: string, init: RequestInit | undefined) => {
				const request = new Request(input, init);
				return testApi.fetch(request);
			},
		});

		testGlobals.api1 = await createAuthenticatedApi(testApi, userWallet1);
		testGlobals.api2 = await createAuthenticatedApi(testApi, userWallet2);
	},
	{ timeout: 20_000 },
);

afterAll(async () => {
	await qdrant.stop();
	await redis.stop();
});

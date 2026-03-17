import { afterAll, beforeAll } from "bun:test";
import { getContracts } from "@pantha/contracts";
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
import { DefaultPolicyManager } from "../../../lib/policies";
import { issueJwtToken } from "../../../lib/utils/jwt";
import { apiRouter } from "../../routes/router";
import type { AppState, RouterEnv } from "../../routes/types";
import { createAuthenticatedApi } from "./apiAuth";
import { testGlobals } from "./globals";
import { HardhatNode } from "./hardhat";
import { testAiAdapter } from "./testAiAdapter";
import { TestObjectStorageService } from "./testObjectStorage";

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
let hardhatNode: HardhatNode;

beforeAll(
	async () => {
		hardhatNode = new HardhatNode();
		await hardhatNode.start();

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

		const objectStorage = new TestObjectStorageService();

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

		const testPolicyManager = new DefaultPolicyManager({ db: testDb });

		const contracts = getContracts({
			chainId: hardhat.id,
			// @ts-expect-error - The
			client: createWalletClient({
				transport: http(),
				chain: hardhat,
				account: privateKeyToAccount(
					"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
				),
			}),
		});

		const appState: AppState = {
			db: testDb,
			ai: createAi({
				aiClient: testAiAdapter,
				vectorDbClient: testVecDb,
				//@ts-expect-error - The test object storage service doesn't fully implement the interface, but it's sufficient for testing purposes
				objectStorage: objectStorage,
			}),
			eventBus: testEventBus,
			policyManager: testPolicyManager,
			objectStorage: objectStorage,
			contracts: contracts,
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
		testGlobals.reauthenticate = async () => {
			// Directly create sessions in the DB and issue JWTs — no SIWE/RPC needed.
			const makeAuthClient = async (walletAddress: string) => {
				const [session] = await testDb
					.insert(testDb.schema.userSessions)
					.values({ userWallet: walletAddress as `0x${string}` })
					.returning();
				if (!session) throw new Error("Failed to create test session");
				const token = issueJwtToken(session.id);
				return hc<typeof apiRouter>("http://localhost", {
					fetch: async (input: string, init: RequestInit | undefined) => {
						const request = new Request(input, init);
						return testApi.fetch(request);
					},
					headers: { Authorization: `Bearer ${token}` },
				});
			};
			testGlobals.api1 = await makeAuthClient(userWallet1.account.address);
			testGlobals.api2 = await makeAuthClient(userWallet2.account.address);
		};
		testGlobals.contracts = contracts;
	},
	{ timeout: 60_000 },
);

afterAll(async () => {
	await hardhatNode.stop();
	await qdrant.stop();
	await redis.stop();
});

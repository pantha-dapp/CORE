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
import { S3ObjectStorage } from "../../../lib/objectStorage/s3";
import { DefaultPolicyManager } from "../../../lib/policies";
import { apiRouter } from "../../routes/router";
import type { AppState, RouterEnv } from "../../routes/types";
import { createAuthenticatedApi } from "./apiAuth";
import { testGlobals } from "./globals";
import { testAiAdapter } from "./testAiAdapter";
import {
	TestObjectStorageService,
	TestSynapseAdapter,
} from "./testObjectStorage";

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
let minio: StartedTestContainer;

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

		minio = await new GenericContainer("minio/minio")
			.withExposedPorts(9000)
			.withEnvironment({
				MINIO_ROOT_USER: "minio",
				MINIO_ROOT_PASSWORD: "password",
			})
			.withCommand(["server", "/data"])
			.withWaitStrategy(Wait.forHttp("/minio/health/live", 9000))
			.start();

		const port = minio.getMappedPort(9000);
		const host = minio.getHost();

		await minio.exec([
			"mc",
			"alias",
			"set",
			"local",
			"http://localhost:9000",
			"minio",
			"password",
		]);
		await minio.exec(["mc", "mb", "local/testing"]);

		const objectStorage = new TestObjectStorageService(
			new S3ObjectStorage({
				accessKeyId: "minio",
				secretAccessKey: "password",
				endpoint: `http://${host}:${port}`,
				bucket: "testing",
				rootDir: ["test-suite"],
			}),
			new TestSynapseAdapter(),
		);

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
			chainId: 1, // Mainnet
			client: createWalletClient({
				transport: http(),
				chain: hardhat,
			}),
		});

		const appState: AppState = {
			db: testDb,
			ai: createAi({
				aiClient: testAiAdapter,
				vectorDbClient: testVecDb,
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
	},
	{ timeout: 20_000 },
);

afterAll(async () => {
	await qdrant.stop();
	await redis.stop();
	await minio.stop();
});

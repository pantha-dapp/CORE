import { beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { testGlobals } from "./helpers/globals";
import { unwrap } from "./helpers/rpc";
import { userWallet1 } from "./helpers/setup";
import { testCompleteChapter, testCreateCourse } from "./helpers/testHelpers";

describe("User Action Chain (certification)", () => {
	it("returns 401 for unauthenticated requests", async () => {
		const { api0 } = testGlobals;
		const res = await api0.users["action-chain"].$get();
		expect(res.status).toBe(401);
	});

	it("returns an empty action chain for a fresh user", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users["action-chain"].$get();
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Request failed");

		expect(data.data.actionChain).toBeArray();
	});

	describe("after completing a chapter", () => {
		let initialChainLength = 0;

		beforeAll(async () => {
			const { api1 } = testGlobals;

			// Capture current length before completing a chapter
			const { actionChain: chainBefore } = await unwrap(
				api1.users["action-chain"].$get(),
			);
			initialChainLength = chainBefore.length;

			const courseId = await testCreateCourse(api1);

			const chaptersRes = await api1.courses[":id"].chapters.$get({
				param: { id: courseId },
			});
			const chaptersData = await chaptersRes.json();
			if (!chaptersData.success) throw new Error("Failed to fetch chapters");

			const chapterId = chaptersData.data.chapters[0]?.id;
			if (!chapterId) throw new Error("No chapters found");

			await testCompleteChapter(chapterId, api1, userWallet1);
			// Give async action registration a moment to settle
			await Bun.sleep(100);
		});

		it("action chain grows after chapter completion", async () => {
			const { api1 } = testGlobals;
			const { actionChain } = await unwrap(api1.users["action-chain"].$get());

			expect(actionChain.length).toBeGreaterThan(initialChainLength);
		});

		it("each action entry has expected shape", async () => {
			const { api1 } = testGlobals;
			const { actionChain } = await unwrap(api1.users["action-chain"].$get());

			const newActions = actionChain.slice(initialChainLength);
			expect(newActions.length).toBeGreaterThan(0);

			for (const action of newActions) {
				expect(action.hash).toBeString();
				expect(action.prevHash).toBeString();
				expect(action.userWallet).toBe(userWallet1.account.address);
				expect(action.label).toBeString();
				expect(action.signature).toBeString();
			}
		});

		it("action chain forms a valid hash chain", async () => {
			const { api1 } = testGlobals;
			const { actionChain } = await unwrap(api1.users["action-chain"].$get());

			// Actions are ordered by seq asc, so each prevHash must equal the prior entry's hash
			for (let i = 1; i < actionChain.length; i++) {
				const prev = actionChain[i - 1];
				const curr = actionChain[i];
				if (!prev || !curr) throw new Error(`Missing action at index ${i}`);
				expect(curr.prevHash).toBe(prev.hash);
			}
		});
	});
});

describe("certification", () => {
	it("returns 401 for unauthenticated requests", async () => {
		const { api0 } = testGlobals;
		const res = await api0.courses[":id"].certification.$post({
			param: { id: crypto.randomUUID() },
		});
		expect(res.status).toBe(401);
	});

	it("returns 422 for an invalid (non-UUID) course id", async () => {
		const { api1 } = testGlobals;
		const res = await api1.courses[":id"].certification.$post({
			param: { id: "not-a-uuid" },
		});
		expect(res.status).toBe(400);
	});

	describe("with an enrolled user who has insufficient progress", () => {
		let courseId: string;

		beforeAll(async () => {
			courseId = await testCreateCourse(testGlobals.api1);
		});

		it("returns 403 when the user has not completed enough of the course", async () => {
			const { api1 } = testGlobals;
			const res = await api1.courses[":id"].certification.$post({
				param: { id: courseId },
			});
			// Policy enforcer throws ForbiddenError (403) when progress <= 10
			expect(res.status).toBe(403);
		});
	});

	describe("with an enrolled user who has sufficient progress", () => {
		let courseId: string;

		beforeAll(
			async () => {
				const { api1, appState } = testGlobals;
				const { db } = appState;
				courseId = await testCreateCourse(api1);

				// Complete the single mock chapter so the enrollment row exists with progress = 1
				const chaptersRes = await api1.courses[":id"].chapters.$get({
					param: { id: courseId },
				});
				const chaptersData = await chaptersRes.json();
				if (!chaptersData.success) throw new Error("Failed to fetch chapters");
				const firstChapterId = chaptersData.data.chapters[0]?.id;
				if (firstChapterId) {
					await testCompleteChapter(firstChapterId, api1, userWallet1);
				}

				// The mock skeleton only generates 1 chapter, so completing it yields
				// progress = 1 which doesn't satisfy the policy (progress > 10).
				// Directly update the enrollment row to bypass the chapter limit.
				await db
					.update(db.schema.userCourses)
					.set({ progress: 11 })
					.where(
						and(
							eq(db.schema.userCourses.userWallet, userWallet1.account.address),
							eq(db.schema.userCourses.courseId, courseId),
						),
					);

				// Consume any CERTIFCT purchases left over from other test suites (e.g.
				// shop.test.ts) so the "returns 401 when CERTIFCT has not been purchased"
				// test starts from a known clean state and doesn't create a stray background
				// job that would consume the certificate bought in the inner describe.
				await db
					.update(db.schema.userPurchases)
					.set({ consumed: 1 })
					.where(
						and(
							eq(
								db.schema.userPurchases.userWallet,
								userWallet1.account.address,
							),
							eq(db.schema.userPurchases.itemId, "CERTIFCT"),
						),
					);

				// Let async event handlers settle
				const bus = testGlobals.appState.eventBus as {
					drain?: () => Promise<void>;
				};
				if (typeof bus.drain === "function") await bus.drain();
			},
			{ timeout: 120_000 },
		);

		it("returns 401 when CERTIFCT has not been purchased", async () => {
			const { api1 } = testGlobals;
			const res = await api1.courses[":id"].certification.$post({
				param: { id: courseId },
			});
			// Policy should reject because the user has no unconsumed CERTIFCT purchase
			expect(res.status).toBe(401);
		});

		describe("after purchasing CERTIFCT", () => {
			beforeAll(async () => {
				const { api1, contracts1, appState } = testGlobals;
				const { db } = appState;

				// token.test.ts uses setSystemTime(now+25h) and leaves a future timestamp
				// in the faucet Redis key, making the cooldown appear active for ~49 hours.
				// Find and delete every faucet key for this wallet so the next claim succeeds.
				const faucetKeys = await db.redis.keys(
					`faucet:last-claim*:${userWallet1.account.address.toLowerCase()}`,
				);
				for (const key of faucetKeys) {
					await db.redis.del(key);
				}

				const faucetRes = await api1.faucet.pantha.$post({
					query: { address: userWallet1.account.address },
				});
				const faucetData = await faucetRes.json();
				if (!faucetData.success || !faucetData.data.claimed) {
					throw new Error("Faucet did not give tokens in cert beforeAll");
				}
				// Ensure the transfer tx is mined before building the permit
				await appState.contracts.$publicClient.waitForTransactionReceipt({
					hash: faucetData.data.txHash,
				});

				const nonce = await contracts1.PanthaToken.read.nonces([
					userWallet1.account.address,
				]);
				const deadline = Math.floor(Date.now() / 1000) + 3600;
				const priceWei = 100 * 10 ** 18;

				const { eip712signature } = await import("@pantha/contracts");
				const signature = await eip712signature(contracts1, "PanthaToken", {
					types: {
						Permit: [
							{ name: "owner", type: "address" },
							{ name: "spender", type: "address" },
							{ name: "value", type: "uint256" },
							{ name: "nonce", type: "uint256" },
							{ name: "deadline", type: "uint256" },
						],
					},
					primaryType: "Permit",
					message: {
						owner: userWallet1.account.address,
						spender: contracts1.PanthaShop.address,
						value: priceWei,
						nonce: Number(nonce),
						deadline,
					},
				});

				const buyRes = await api1.shop.buy.$post({
					query: {
						itemId: "CERTIFCT",
						deadline: deadline.toString(),
						signature,
					},
				});
				if (![200, 201].includes(buyRes.status)) {
					throw new Error(
						`Failed to purchase CERTIFCT in beforeAll: status ${buyRes.status}`,
					);
				}
				// Wait for the on-chain receipt to be confirmed and the purchase recorded in DB
				await Bun.sleep(2000);
			});

			let sharedJobId: string;

			it("returns 201 with a jobId when certification is requested", async () => {
				const { api1 } = testGlobals;
				const res = await api1.courses[":id"].certification.$post({
					param: { id: courseId },
				});
				expect(res.status).toBe(201);

				const data = await res.json();
				expect(data.success).toBe(true);
				if (!data.success) throw new Error("Unexpected failure");
				// createJob returns { id, promise }; only `id` is serialised in the JSON response
				expect(data.data.jobId.id).toBeString();
				sharedJobId = data.data.jobId.id;
			});

			it("the certification job eventually succeeds", async () => {
				const job = await awaitJob(sharedJobId);
				expect(job.state).toBe("success");
			});

			it("CERTIFCT purchase is marked consumed after successful certification", async () => {
				const { appState } = testGlobals;
				const { db } = appState;
				const { eq, and } = await import("drizzle-orm");

				const purchase = db
					.select()
					.from(db.schema.userPurchases)
					.where(
						and(
							eq(
								db.schema.userPurchases.userWallet,
								userWallet1.account.address,
							),
							eq(db.schema.userPurchases.itemId, "CERTIFCT"),
						),
					)
					.get();

				expect(purchase).toBeDefined();
				expect(purchase?.consumed).toBe(1);
			});

			it("cannot request certification again after CERTIFCT is consumed", async () => {
				const { api1 } = testGlobals;
				const res = await api1.courses[":id"].certification.$post({
					param: { id: courseId },
				});
				// No unconsumed CERTIFCT left → policy blocks with 403
				expect(res.status).toBe(403);
			});
		});

		it("the job endpoint returns 404 for an unknown job id", async () => {
			const { api1 } = testGlobals;
			const res = await api1.jobs[":id"].$get({
				param: { id: crypto.randomUUID() },
			});
			expect(res.status).toBe(404);
		});
	});

	describe("with a user who is not enrolled", () => {
		let courseId: string;

		beforeAll(async () => {
			// Create a course as user1 so it exists but user2 is not enrolled
			courseId = await testCreateCourse(testGlobals.api1);
		});

		it("returns 403 when the requesting user is not enrolled", async () => {
			const { api2 } = testGlobals;
			const res = await api2.courses[":id"].certification.$post({
				param: { id: courseId },
			});
			// Policy enforcer throws ForbiddenError (403) for non-enrolled user
			expect(res.status).toBe(403);
		});
	});

	it("returns 404 for a course that does not exist", async () => {
		// A random UUID that is guaranteed not to exist in the database
		const { api1 } = testGlobals;
		const res = await api1.courses[":id"].certification.$post({
			param: { id: crypto.randomUUID() },
		});
		// Policy enforcer throws NotFoundError (404) for a non-existent course
		expect(res.status).toBe(404);
	});
});

describe("GET /users/:wallet/certificates", () => {
	it("returns 401 for unauthenticated requests", async () => {
		const { api0 } = testGlobals;
		const res = await api0.users[":wallet"].certificates.$get({
			param: { wallet: userWallet1.account.address },
		});
		expect(res.status).toBe(401);
	});

	it("returns an array of certificates for the authenticated user", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users[":wallet"].certificates.$get({
			param: { wallet: userWallet1.account.address },
		});
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Request failed");

		expect(data.data.certificates).toBeArray();
	});

	it("each certificate entry has the expected shape", async () => {
		const { api1 } = testGlobals;
		const { certificates } = await unwrap(
			api1.users[":wallet"].certificates.$get({
				param: { wallet: userWallet1.account.address },
			}),
		);

		for (const cert of certificates) {
			expect(cert.id).toBeString();
			expect(cert.userWallet).toBeString();
			expect(cert.txnHash).toBeString();
			expect(cert.dataUri).toBeString();
			expect(cert.tokenId).toBeString();
		}
	});
});

async function awaitJob(
	jobId: string,
): Promise<{ state: string; error?: string }> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error(`Job ${jobId} timed out after 60 seconds`));
		}, 60_000);

		const interval = setInterval(async () => {
			try {
				const { api1 } = testGlobals;
				const res = await api1.jobs[":id"].$get({ param: { id: jobId } });
				const data = await res.json();
				if (!data.success) {
					clearInterval(interval);
					clearTimeout(timeout);
					reject(new Error("Failed to fetch job status"));
					return;
				}
				if (data.data.state === "success" || data.data.state === "failed") {
					clearInterval(interval);
					clearTimeout(timeout);
					resolve(data.data);
				}
			} catch (err) {
				clearInterval(interval);
				clearTimeout(timeout);
				reject(err);
			}
		}, 500);
	});
}

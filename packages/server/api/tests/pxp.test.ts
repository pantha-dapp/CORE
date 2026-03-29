import { describe, expect, it } from "bun:test";
import { eip712signature } from "@pantha/contracts";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { testGlobals } from "./helpers/globals";
import { unwrap } from "./helpers/rpc";
import { userWallet1 } from "./helpers/setup";
import { testCompleteChapter, testCreateCourse } from "./helpers/testHelpers";

describe("Xp minting", async () => {
	const { api1 } = testGlobals;
	const courseId = await testCreateCourse(api1);
	const res = await api1.courses[":id"].chapters.$get({
		param: { id: courseId },
	});
	const courseData = await res.json();
	if (!courseData.success || !courseData.data.chapters[0]) {
		throw new Error("Failed to fetch course chapters");
	}

	const chapterId = courseData.data.chapters[0].id;
	let firstXpCount: number = 0;
	it("should award XP instantly when a chapter is completed", async () => {
		const { user: userBefore } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		const initialXp = userBefore.xpCount;

		expect(initialXp).toBeNumber();
		firstXpCount = initialXp;

		await testCompleteChapter(chapterId, api1);
		await Bun.sleep(50);

		const { user: userAfter } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		const finalXp = userAfter.xpCount;

		expect(finalXp).toBeGreaterThan(initialXp);
	});

	it("should kepp XP after txn settlement", async () => {
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const { user } = await unwrap(
			api1.users[":wallet"].$get({
				param: { wallet: userWallet1.account.address },
			}),
		);
		const finalXp = user.xpCount;

		expect(finalXp).toBeGreaterThan(firstXpCount);
	});

	it("Should track txn status in db", async () => {
		const { db, contracts } = testGlobals.appState;

		await contracts.$$testClient.setAutomine(false);
		await testCompleteChapter(chapterId, api1);
		await Bun.sleep(50);

		const records = await db
			.select()
			.from(db.schema.userXpLog)
			.orderBy(desc(db.schema.userXpLog.createdAt));
		const recordBefore = records[0];

		expect(recordBefore?.status).toBe("pending");

		if (!recordBefore) {
			throw new Error("No record found in userXpLog");
		}
		if (!recordBefore.transactionHash) {
			throw new Error("No transaction hash found in userXpLog record");
		}

		await contracts.$$testClient.setAutomine(true);
		await contracts.$$testClient.mine({ blocks: 1 });
		await contracts.$publicClient.waitForTransactionReceipt({
			hash: recordBefore.transactionHash,
		});

		const [recordAfter] = await db
			.select()
			.from(db.schema.userXpLog)
			.where(eq(db.schema.userXpLog.id, recordBefore.id));

		expect(recordAfter).toBeDefined();
		expect(recordAfter?.status).toBe("success");
	});
});

// ---------------------------------------------------------------------------
// XP multiplier boosts — functional coverage
// ---------------------------------------------------------------------------

describe("XP multiplier boosts", async () => {
	const { api1, contracts1 } = testGlobals;

	// Fresh course so the first testCompleteChapter call fires "chapter.completed"
	// and subsequent calls fire "chapter.revised" (lower XP base).
	const boostCourseId = await testCreateCourse(api1);
	const boostChaptersRes = await api1.courses[":id"].chapters.$get({
		param: { id: boostCourseId },
	});
	const boostChaptersData = await boostChaptersRes.json();
	if (!boostChaptersData.success || !boostChaptersData.data.chapters[0]) {
		throw new Error("Failed to fetch chapters for XP multiplier tests");
	}
	const boostChapterId = boostChaptersData.data.chapters[0].id;

	const MULTIPLIER_IDS = ["XPMLT150", "XPMLT200", "XPMLT300"];

	/** Move all multiplier purchases to 2 days ago — safe clean slate
	 *  with no active boost and zero daily count. */
	async function clearAllBoosts() {
		const { db } = testGlobals.appState;
		await db
			.update(db.schema.userPurchases)
			.set({ purchasedAt: new Date(Date.now() - 49 * 60 * 60 * 1000) })
			.where(
				and(
					eq(db.schema.userPurchases.userWallet, userWallet1.account.address),
					inArray(db.schema.userPurchases.itemId, MULTIPLIER_IDS),
				),
			);
	}

	/** Poll DB until the purchase for `itemId` bought at/after `since` is recorded (max 10 s).
	 *  This is necessary because the shop route records the purchase in a background
	 *  waitForTransactionReceipt handler and returns 201 before it completes. */
	async function waitForBoostPurchase(
		itemId: string,
		since: Date,
	): Promise<void> {
		const { db } = testGlobals.appState;
		for (let i = 0; i < 100; i++) {
			const [row] = await db
				.select({ id: db.schema.userPurchases.id })
				.from(db.schema.userPurchases)
				.where(
					and(
						eq(db.schema.userPurchases.userWallet, userWallet1.account.address),
						eq(db.schema.userPurchases.itemId, itemId),
						gte(db.schema.userPurchases.purchasedAt, since),
					),
				)
				.limit(1);
			if (row) return;
			await Bun.sleep(100);
		}
		throw new Error(`Boost ${itemId} was not recorded in DB within 10 seconds`);
	}

	/** Move one specific purchase (identified by itemId + the timestamp it was bought after)
	 *  to 11 minutes ago: expired (>10 min window) but still within today for daily counting. */
	async function expirePurchase(itemId: string, since: Date) {
		const { db } = testGlobals.appState;
		const [row] = await db
			.select({ id: db.schema.userPurchases.id })
			.from(db.schema.userPurchases)
			.where(
				and(
					eq(db.schema.userPurchases.userWallet, userWallet1.account.address),
					eq(db.schema.userPurchases.itemId, itemId),
					gte(db.schema.userPurchases.purchasedAt, since),
				),
			)
			.limit(1);
		if (!row) return;
		await db
			.update(db.schema.userPurchases)
			.set({ purchasedAt: new Date(Date.now() - 11 * 60 * 1000) })
			.where(eq(db.schema.userPurchases.id, row.id));
	}

	/** Bust the Redis faucet cooldown for userWallet1 so the next faucet call succeeds. */
	async function bustFaucetCooldown() {
		const { appState } = testGlobals;
		const key = `faucet:last-claim${appState.contracts.PanthaToken.address}:${userWallet1.account.address.toLowerCase()}`;
		await appState.db.redis.del(key);
	}

	/** Buy a boost and block until the purchase is confirmed in userPurchases. */
	async function buyBoost(itemId: "XPMLT150" | "XPMLT200" | "XPMLT300") {
		await bustFaucetCooldown();
		await api1.faucet.pantha.$post({
			query: { address: userWallet1.account.address },
		});
		const { items } = await unwrap(api1.shop.$get());
		const item = items.find((i) => i.id === itemId);
		if (!item) throw new Error(`${itemId} not found in shop`);

		const buyTime = new Date();
		const nonce = await contracts1.PanthaToken.read.nonces([
			userWallet1.account.address,
		]);
		const deadline = Math.floor(Date.now() / 1000) + 3600;
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
				value: item.priceHuman * 10 ** 18,
				nonce: Number(nonce),
				deadline,
			},
		});

		const res = await api1.shop.buy.$post({
			query: { itemId, deadline: deadline.toString(), signature },
		});

		if (res.status === 200 || res.status === 201) {
			// Block until the background receipt handler has inserted the purchase row.
			// This guarantees getActiveXpMultiplier() will find it before mintXpForChapter runs.
			await waitForBoostPurchase(itemId, buyTime);
		}

		return { res, buyTime };
	}

	/** Fetch the latest XP log row for userWallet1. */
	async function getLatestXpLog() {
		const { db } = testGlobals.appState;
		const [row] = await db
			.select()
			.from(db.schema.userXpLog)
			.where(eq(db.schema.userXpLog.userWallet, userWallet1.account.address))
			.orderBy(desc(db.schema.userXpLog.createdAt))
			.limit(1);
		return row;
	}

	/** Poll until a NEW XP log entry (not in `knownIds`) appears for userWallet1 (max 10 s). */
	async function waitForNewXpLog(
		knownIds: Set<string>,
	): Promise<NonNullable<Awaited<ReturnType<typeof getLatestXpLog>>>> {
		const { db } = testGlobals.appState;
		for (let i = 0; i < 100; i++) {
			const rows = await db
				.select()
				.from(db.schema.userXpLog)
				.where(eq(db.schema.userXpLog.userWallet, userWallet1.account.address))
				.orderBy(desc(db.schema.userXpLog.createdAt))
				.limit(10);
			const newRow = rows.find((r) => !knownIds.has(r.id));
			if (newRow) return newRow;
			await Bun.sleep(100);
		}
		throw new Error("No new XP log entry appeared within 10 seconds");
	}

	// ------------------------------------------------------------------
	// Calibration — prime the chapter and learn the actual revision base XP
	// ------------------------------------------------------------------

	let baseRevisionXp = 0;

	it("establishes base revision XP (no boost)", async () => {
		await clearAllBoosts();

		// Prime with first completion (chapter.completed, base = 25)
		const existingIds1 = new Set(
			(
				await testGlobals.appState.db
					.select({ id: testGlobals.appState.db.schema.userXpLog.id })
					.from(testGlobals.appState.db.schema.userXpLog)
					.where(
						eq(
							testGlobals.appState.db.schema.userXpLog.userWallet,
							userWallet1.account.address,
						),
					)
			).map((r) => r.id),
		);
		await testCompleteChapter(boostChapterId, api1);
		await waitForNewXpLog(existingIds1); // wait for chapter.completed log

		// Revision (chapter.revised, base = 5; this is our reference)
		const existingIds2 = new Set(
			(
				await testGlobals.appState.db
					.select({ id: testGlobals.appState.db.schema.userXpLog.id })
					.from(testGlobals.appState.db.schema.userXpLog)
					.where(
						eq(
							testGlobals.appState.db.schema.userXpLog.userWallet,
							userWallet1.account.address,
						),
					)
			).map((r) => r.id),
		);
		await testCompleteChapter(boostChapterId, api1);
		const revisionLog = await waitForNewXpLog(existingIds2);

		expect(revisionLog.xpGained).toBeGreaterThan(0);
		baseRevisionXp = revisionLog.xpGained;
	});

	// ------------------------------------------------------------------
	// Positive — verify each multiplier is applied to chapter revision XP
	// ------------------------------------------------------------------

	it("awards 1.5x XP (XPMLT150) on chapter revision", async () => {
		await clearAllBoosts();
		await buyBoost("XPMLT150");

		const existingIds = new Set(
			(
				await testGlobals.appState.db
					.select({ id: testGlobals.appState.db.schema.userXpLog.id })
					.from(testGlobals.appState.db.schema.userXpLog)
					.where(
						eq(
							testGlobals.appState.db.schema.userXpLog.userWallet,
							userWallet1.account.address,
						),
					)
			).map((r) => r.id),
		);
		await testCompleteChapter(boostChapterId, api1);
		const log = await waitForNewXpLog(existingIds);
		expect(log.xpGained).toBe(Math.floor(baseRevisionXp * 1.5));
	});

	it("awards 2x XP (XPMLT200) on chapter revision", async () => {
		await clearAllBoosts();
		await buyBoost("XPMLT200");

		const existingIds = new Set(
			(
				await testGlobals.appState.db
					.select({ id: testGlobals.appState.db.schema.userXpLog.id })
					.from(testGlobals.appState.db.schema.userXpLog)
					.where(
						eq(
							testGlobals.appState.db.schema.userXpLog.userWallet,
							userWallet1.account.address,
						),
					)
			).map((r) => r.id),
		);
		await testCompleteChapter(boostChapterId, api1);
		const log = await waitForNewXpLog(existingIds);
		expect(log.xpGained).toBe(Math.floor(baseRevisionXp * 2));
	});

	it("awards 3x XP (XPMLT300) on chapter revision", async () => {
		await clearAllBoosts();
		await buyBoost("XPMLT300");

		const existingIds = new Set(
			(
				await testGlobals.appState.db
					.select({ id: testGlobals.appState.db.schema.userXpLog.id })
					.from(testGlobals.appState.db.schema.userXpLog)
					.where(
						eq(
							testGlobals.appState.db.schema.userXpLog.userWallet,
							userWallet1.account.address,
						),
					)
			).map((r) => r.id),
		);
		await testCompleteChapter(boostChapterId, api1);
		const log = await waitForNewXpLog(existingIds);
		expect(log.xpGained).toBe(Math.floor(baseRevisionXp * 3));
	});

	it("awards base XP when no boost is active", async () => {
		await clearAllBoosts();

		const existingIds = new Set(
			(
				await testGlobals.appState.db
					.select({ id: testGlobals.appState.db.schema.userXpLog.id })
					.from(testGlobals.appState.db.schema.userXpLog)
					.where(
						eq(
							testGlobals.appState.db.schema.userXpLog.userWallet,
							userWallet1.account.address,
						),
					)
			).map((r) => r.id),
		);
		await testCompleteChapter(boostChapterId, api1);
		const log = await waitForNewXpLog(existingIds);
		expect(log.xpGained).toBe(baseRevisionXp);
	});

	// ------------------------------------------------------------------
	// Policy — only one active boost at a time
	// ------------------------------------------------------------------

	it("blocks purchasing a second boost while one is active", async () => {
		await clearAllBoosts();
		await buyBoost("XPMLT150"); // recorded in DB; processingPurchases lock released

		await api1.faucet.pantha.$post({
			query: { address: userWallet1.account.address },
		});
		const { items } = await unwrap(api1.shop.$get());
		const item = items.find((i) => i.id === "XPMLT200");
		if (!item) throw new Error("XPMLT200 not found in shop");
		const nonce = await contracts1.PanthaToken.read.nonces([
			userWallet1.account.address,
		]);
		const deadline = Math.floor(Date.now() / 1000) + 3600;
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
				value: item.priceHuman * 10 ** 18,
				nonce: Number(nonce),
				deadline,
			},
		});
		const res = await api1.shop.buy.$post({
			query: { itemId: "XPMLT200", deadline: deadline.toString(), signature },
		});
		expect(res.status).toBe(409);
	});

	// ------------------------------------------------------------------
	// Policy — max 2 boosts per day
	// ------------------------------------------------------------------

	it("blocks a 3rd boost purchase on the same day", async () => {
		await clearAllBoosts();

		// 1st boost today — buy and immediately expire (still within today's UTC date)
		const { buyTime: t1 } = await buyBoost("XPMLT150");
		await expirePurchase("XPMLT150", t1);

		// 2nd boost today
		const { res: r2, buyTime: t2 } = await buyBoost("XPMLT200");
		expect([200, 201]).toContain(r2.status);
		await expirePurchase("XPMLT200", t2);

		// 3rd attempt → daily limit reached
		await api1.faucet.pantha.$post({
			query: { address: userWallet1.account.address },
		});
		const { items } = await unwrap(api1.shop.$get());
		const item = items.find((i) => i.id === "XPMLT300");
		if (!item) throw new Error("XPMLT300 not found in shop");
		const nonce = await contracts1.PanthaToken.read.nonces([
			userWallet1.account.address,
		]);
		const deadline = Math.floor(Date.now() / 1000) + 3600;
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
				value: item.priceHuman * 10 ** 18,
				nonce: Number(nonce),
				deadline,
			},
		});
		const res = await api1.shop.buy.$post({
			query: { itemId: "XPMLT300", deadline: deadline.toString(), signature },
		});
		expect(res.status).toBe(409);

		await clearAllBoosts();
	});
});

import {
	afterAll,
	beforeAll,
	describe,
	expect,
	it,
	setSystemTime,
} from "bun:test";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import type { Address } from "viem";
import { createDb } from "../../lib/db";
import { registerActivityForStreaks } from "../../lib/utils/streaks";

// registerActivityForStreaks only touches SQLite; it never calls vector or redis
// biome-ignore lint/suspicious/noExplicitAny: test stub
const fakeVecDb = {} as any;
// biome-ignore lint/suspicious/noExplicitAny: test stub
const fakeRedis = {} as any;

// Well-known Hardhat address - valid checksummed EVM address
const WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as Address;

// Anchor every time-shift to a known UTC noon.
// Europe/London is UTC+0 in winter, so "2025-06-15T12:00:00Z" maps to "2025-06-15".
const DAY_0 = new Date("2025-06-15T12:00:00Z").getTime();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe("User Streaks", () => {
	let db: ReturnType<typeof createDb>;

	beforeAll(() => {
		db = createDb(":memory:", {
			vectorDbClient: fakeVecDb,
			redisClient: fakeRedis,
		});
		// Runs all migrations in ./drizzle, including the composite-PK fix for
		// user_daily_activity so streaks correctly advance day-over-day.
		migrate(db.$db, { migrationsFolder: "./drizzle" });
	});

	afterAll(() => {
		// Restore real time so other test files are unaffected
		setSystemTime();
	});

	// Seed
	it("seeds the test user with a timezone", async () => {
		await db.insert(db.schema.users).values({
			walletAddress: WALLET,
			lastActiveAt: new Date(DAY_0),
			timezone: "Europe/London",
		});

		const [user] = await db
			.select()
			.from(db.schema.users)
			.where(eq(db.schema.users.walletAddress, WALLET));

		expect(user?.walletAddress).toBe(WALLET);
		expect(user?.timezone).toBe("Europe/London");
	});

	// Day 0
	it("streak is 1 after the first day's activity", async () => {
		setSystemTime(DAY_0);

		await registerActivityForStreaks(db, WALLET);

		const [streak] = await db
			.select()
			.from(db.schema.userStreaks)
			.where(eq(db.schema.userStreaks.userId, WALLET));

		expect(streak?.currentStreak).toBe(1);
		expect(streak?.lastActiveDate).toBe("2025-06-15");

		setSystemTime();
	});

	it("duplicate activity on the same day does NOT increment the streak", async () => {
		setSystemTime(DAY_0);

		// Two extra calls on the same calendar day
		await registerActivityForStreaks(db, WALLET);
		await registerActivityForStreaks(db, WALLET);

		const [streak] = await db
			.select()
			.from(db.schema.userStreaks)
			.where(eq(db.schema.userStreaks.userId, WALLET));

		// Must still be 1, not 3
		expect(streak?.currentStreak).toBe(1);

		setSystemTime();
	});

	// Day 1 - consecutive
	it("streak increments to 2 on the next consecutive day", async () => {
		setSystemTime(DAY_0 + ONE_DAY_MS); // 2025-06-16

		await registerActivityForStreaks(db, WALLET);

		const [streak] = await db
			.select()
			.from(db.schema.userStreaks)
			.where(eq(db.schema.userStreaks.userId, WALLET));

		expect(streak?.currentStreak).toBe(2);
		expect(streak?.lastActiveDate).toBe("2025-06-16");

		setSystemTime();
	});

	// Day 3 - skipped day 2, streak should reset
	it("streak resets to 1 when a day is skipped", async () => {
		// Skip 2025-06-17 entirely, jump straight to 2025-06-18
		setSystemTime(DAY_0 + 3 * ONE_DAY_MS);

		await registerActivityForStreaks(db, WALLET);

		const [streak] = await db
			.select()
			.from(db.schema.userStreaks)
			.where(eq(db.schema.userStreaks.userId, WALLET));

		expect(streak?.currentStreak).toBe(1);
		expect(streak?.lastActiveDate).toBe("2025-06-18");

		setSystemTime();
	});

	// Day 4 - consecutive again, streak should build back up
	it("streak builds back up to 2 after a reset when consecutive again", async () => {
		setSystemTime(DAY_0 + 4 * ONE_DAY_MS); // 2025-06-19

		await registerActivityForStreaks(db, WALLET);

		const [streak] = await db
			.select()
			.from(db.schema.userStreaks)
			.where(eq(db.schema.userStreaks.userId, WALLET));

		expect(streak?.currentStreak).toBe(2);

		setSystemTime();
	});
});

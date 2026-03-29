import { and, eq, gt, gte, inArray } from "drizzle-orm";
import {
	XP_MULTIPLIER_DURATION_MS,
	XP_MULTIPLIER_ITEMS,
} from "../../data/shop";
import { ConflictError, NotFoundError } from "../errors";
import type { Enforcers } from ".";

/** Returns the UTC Date representing midnight (start of day) in the given IANA timezone. */
function startOfDayInTimezone(tz: string): Date {
	const now = new Date();
	// Date string in the user's timezone, e.g. "2026-03-29"
	const localDate = new Intl.DateTimeFormat("sv-SE", { timeZone: tz }).format(
		now,
	);
	// Reference point: midnight UTC of that local date
	const utcGuess = new Date(`${localDate}T00:00:00Z`);
	// What time does utcGuess correspond to in the user's timezone?
	const timeStr = new Intl.DateTimeFormat("en", {
		timeZone: tz,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(utcGuess);
	const [h, m] = timeStr.split(":").map(Number) as [number, number];
	// Check if utcGuess lands on the same date in the user's TZ (UTC+ zone) or previous day (UTC- zone)
	const dateAtGuess = new Intl.DateTimeFormat("sv-SE", { timeZone: tz }).format(
		utcGuess,
	);
	const adjustMins =
		dateAtGuess === localDate
			? -(h * 60 + m) // UTC+ zone: subtract offset to reach midnight
			: 24 * 60 - h * 60 - m; // UTC- zone: add remaining time to next midnight
	return new Date(utcGuess.getTime() + adjustMins * 60 * 1000);
}

const enforcers: Enforcers<"shop"> = {
	"shop.purchase": async (user, resource, app) => {
		const { db } = app;
		const activePurchases = await db
			.select()
			.from(db.schema.userPurchases)
			.where(
				and(
					eq(db.schema.userPurchases.userWallet, user),
					eq(db.schema.userPurchases.itemId, resource.itemId),
					eq(db.schema.userPurchases.consumed, 0),
				),
			);

		switch (resource.itemId) {
			case "STRKFRZ0": {
				if (activePurchases?.length) {
					throw new ConflictError("You have already purchased this item.");
				}

				return true;
			}
			case "CERTIFCT": {
				if (activePurchases?.length) {
					throw new ConflictError(
						"You already have an unused certificate. Use it before purchasing another.",
					);
				}

				return true;
			}
			case "XPMLT150":
			case "XPMLT200":
			case "XPMLT300": {
				const xpMultiplierIds = Object.keys(XP_MULTIPLIER_ITEMS);

				const [activeBoost] = await db
					.select()
					.from(db.schema.userPurchases)
					.where(
						and(
							eq(db.schema.userPurchases.userWallet, user),
							inArray(db.schema.userPurchases.itemId, xpMultiplierIds),
							eq(db.schema.userPurchases.consumed, 0),
							gt(
								db.schema.userPurchases.purchasedAt,
								new Date(Date.now() - XP_MULTIPLIER_DURATION_MS),
							),
						),
					)
					.limit(1);

				if (activeBoost) {
					throw new ConflictError(
						"An XP boost is already active. Wait for it to expire before purchasing another.",
					);
				}

				const userRecord = await db.userByWallet({ userWallet: user });
				const timezone = userRecord?.timezone ?? "Europe/London";
				const dayStart = startOfDayInTimezone(timezone);

				const todayBoosts = await db
					.select()
					.from(db.schema.userPurchases)
					.where(
						and(
							eq(db.schema.userPurchases.userWallet, user),
							inArray(db.schema.userPurchases.itemId, xpMultiplierIds),
							gte(db.schema.userPurchases.purchasedAt, dayStart),
						),
					);

				if (todayBoosts.length >= 2) {
					throw new ConflictError(
						"You've reached your daily limit of 2 XP boosts.",
					);
				}

				return true;
			}
			default:
				throw new NotFoundError("Shop item not found");
		}
	},
};

export default enforcers;

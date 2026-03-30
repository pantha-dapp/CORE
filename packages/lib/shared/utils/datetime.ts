export function dateInTimezone(tz: string, base = new Date()) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: tz,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(base);

	const y = parts.find((p) => p.type === "year")?.value;
	const m = parts.find((p) => p.type === "month")?.value;
	const d = parts.find((p) => p.type === "day")?.value;

	if (!y || !m || !d) {
		throw new Error("unreachable");
	}

	return `${y}-${m}-${d}`;
}

export function yesterdayOf(date: string) {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

/**
 * Returns the effective (display) streak value for a user.
 *
 * The backend only resets streak on the next chapter completion, so a stale
 * non-zero streak can linger indefinitely. This function applies a client-side
 * correction: if the user's last active date is not today (in the local
 * timezone), the streak is treated as 0 — regardless of what the backend says.
 */
export function getEffectiveStreak(
	streak:
		| { currentStreak: number; lastActiveDate: string | null }
		| undefined
		| null,
): number {
	if (!streak || streak.currentStreak === 0 || !streak.lastActiveDate) {
		return streak?.currentStreak ?? 0;
	}
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const today = dateInTimezone(tz);
	const yesterday = yesterdayOf(today);
	// Streak is still alive if the user was active today OR yesterday.
	// (Yesterday's streak is valid — the user still has today to extend it.)
	// Anything older means they missed a full day → broken streak → show 0.
	return streak.lastActiveDate >= yesterday ? streak.currentStreak : 0;
}

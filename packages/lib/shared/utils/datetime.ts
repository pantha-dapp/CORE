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

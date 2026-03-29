import { MINUTE } from "@pantha/shared/constants";

export const shopItems = [
	{
		id: "STRKFRZ0",
		name: "Streak Freeze",
		description:
			"Shield your learning streak for one day! Miss a day without losing your momentum.",
		warning: "Must own before use • Won't restore lost streaks",
		priceHuman: 50,
	},
	{
		id: "CERTIFCT",
		name: "Course Certificate",
		description:
			"Redeem to receive an on-chain NFT certificate for a course you have made progress in.",
		warning:
			"Must complete at least 10 chapters before requesting • Single use",
		priceHuman: 100,
	},
	{
		id: "XPMLT150",
		name: "1.5x XP Boost",
		description:
			"Earn 1.5x XP on every chapter for the next 10 minutes. Activates immediately on purchase.",
		warning:
			"Cannot stack with other XP boosts • Expires after 10 minutes • 2 boosts per day max",
		priceHuman: 30,
	},
	{
		id: "XPMLT200",
		name: "2x XP Boost",
		description:
			"Earn 2x XP on every chapter for the next 10 minutes. Activates immediately on purchase.",
		warning:
			"Cannot stack with other XP boosts • Expires after 10 minutes • 2 boosts per day max",
		priceHuman: 60,
	},
	{
		id: "XPMLT300",
		name: "3x XP Boost",
		description:
			"Earn 3x XP on every chapter for the next 10 minutes. Activates immediately on purchase.",
		warning:
			"Cannot stack with other XP boosts • Expires after 10 minutes • 2 boosts per day max",
		priceHuman: 90,
	},
] as const satisfies ShopItem[];

type ShopItem = {
	id: string;
	name: string;
	description: string;
	warning?: string;
	priceHuman: number;
};

export type ShopItemId = (typeof shopItems)[number]["id"];

export const XP_MULTIPLIER_ITEMS = {
	XPMLT150: 1.5,
	XPMLT200: 2,
	XPMLT300: 3,
} as const satisfies Partial<Record<ShopItemId, number>>;

export type XpMultiplierItemId = keyof typeof XP_MULTIPLIER_ITEMS;

export const XP_MULTIPLIER_DURATION_MS = 10 * MINUTE;

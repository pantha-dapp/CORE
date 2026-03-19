export const shopItems = [
	{
		id: "STRKFRZ0",
		name: "Streak Freeze",
		description:
			"Shield your learning streak for one day! Miss a day without losing your momentum.",
		warning: "Must own before use • Won't restore lost streaks",
		priceHuman: 50,
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

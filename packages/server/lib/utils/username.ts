const ADJECTIVES = [
	"Crazy",
	"Swift",
	"Silent",
	"Lucky",
	"Cosmic",
	"Brave",
	"Happy",
	"Sneaky",
	"Epic",
	"Chill",
	"Prosperous",
	"Radiant",
	"Mighty",
	"Clever",
	"Witty",
	"Bold",
	"Daring",
	"Fearless",
	"Gentle",
	"Jolly",
];

const NOUNS = [
	"Dragon",
	"Pants",
	"Tiger",
	"Wizard",
	"Falcon",
	"Ninja",
	"Otter",
	"Phoenix",
	"Beaver",
	"Samurai",
	"Unicorn",
	"Gorilla",
	"Shark",
	"Knight",
	"Alien",
	"Robot",
	"Pirate",
	"Mermaid",
	"Centaur",
	"Yeti",
	"Gnome",
	"Viking",
	"Zombie",
	"Giraffe",
];

function choice<T>(arr: T[]): T {
	const chosen = arr[Math.floor(Math.random() * arr.length)];
	if (!chosen) {
		throw new Error("Array to choice from is empty");
	}
	return chosen;
}
function randomNumber(digits = 4): string {
	const min = 10 ** (digits - 1);
	const max = 10 ** digits - 1;
	return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export function generateRandomUsername(options?: {
	digits?: number;
	separator?: "" | "_" | "-";
	withNumber?: boolean;
}): string {
	const { digits = 4, separator = "", withNumber = true } = options ?? {};

	const adjective = choice(ADJECTIVES);
	const noun = choice(NOUNS);
	const number = withNumber ? randomNumber(digits) : "";

	return `${adjective}${separator}${noun}${number}`;
}

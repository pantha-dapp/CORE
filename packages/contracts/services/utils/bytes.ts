import { keccak256, pad, toHex } from "viem";

export const bytes8 = (input: Parameters<typeof toHex>[0]) =>
	pad(toHex(input), { size: 8 });

export const identifierB8 = (input: string) => bytes8(keccak256(toHex(input)));

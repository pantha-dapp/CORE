import { type Hex, keccak256, pad, sliceHex, toHex } from "viem";

export const bytes8 = (input: Parameters<typeof toHex>[0]) =>
	pad(toHex(input), { size: 8 });

export const identifierB8 = (input: string): Hex =>
	sliceHex(keccak256(toHex(input)), 0, 8);

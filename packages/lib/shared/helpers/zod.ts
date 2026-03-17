import { getAddress, type Hex, isAddress, isHex } from "viem";
import z from "zod";

export const zEvmAddress = () =>
	z
		.string()
		.refine((value) => isAddress(value), "Invalid Ethereum address")
		.transform((value) => getAddress(value));

export const zHex = () =>
	z
		.string()
		.refine((value) => isHex(value), "Invalid hex string")
		.transform((value) => value.toLowerCase() as Hex);

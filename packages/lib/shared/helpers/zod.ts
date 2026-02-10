import { getAddress, isAddress } from "viem";
import z from "zod";

export const zEvmAddress = () =>
	z
		.string()
		.refine((value) => isAddress(value), "Invalid Ethereum address")
		.transform((value) => getAddress(value));

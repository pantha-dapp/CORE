import { HOUR, MB } from "@pantha/shared/constants";
import { hexToBytes, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import env from "./env";

export const MAX_FILE_SIZE = 30 * MB;

export const JWTalgorithm = "HS512";
export const JWTexpiration = (3 * HOUR) / 1000; // 3 hours
const JWTPrivateKey = keccak256(
	hexToBytes(env.EVM_PRIVATE_KEY_SYNAPSE as `0x${string}`),
);
const JWTPublicKey = privateKeyToAccount(JWTPrivateKey).publicKey;
export const JWTKeypair = { private: JWTPrivateKey, public: JWTPublicKey };

export const DOMAIN = "https://filosign.xyz";
export const URI = "https://filosign.xyz";

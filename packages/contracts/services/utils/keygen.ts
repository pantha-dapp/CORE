import { x25519 } from "@noble/curves/ed25519.js";
import {
	type Account,
	type Chain,
	type Hex,
	type Transport,
	toBytes,
	toHex,
	type WalletClient,
} from "viem";

export async function walletKeyGen(
	wallet: Wallet,
	args: {
		salts?: {
			challenge: Hex;
			seed: Hex;
		};
	},
) {
	const { salts } = args;
	const saltSeed = salts?.seed
		? toBytes(salts.seed)
		: crypto.getRandomValues(new Uint8Array(16));
	const saltChallenge = salts?.challenge
		? toBytes(salts.challenge)
		: crypto.getRandomValues(new Uint8Array(16));

	const registerChallenge = `pantha:${wallet.account.address}:${saltChallenge}:${saltSeed}`;

	const signature = await wallet.signMessage({
		message: registerChallenge,
	});

	const seed = await hkdfExtractExpand(
		toBytes(signature),
		saltSeed,
		toBytes(registerChallenge),
		32,
	);

	const account = await keyGen({ seed });

	return {
		seed,
		saltSeed: toHex(saltSeed),
		saltChallenge: toHex(saltChallenge),
		account,
	};
}

export async function hkdfExtractExpand(
	source: Uint8Array,
	salt: Uint8Array | null,
	info: Uint8Array | null,
	length: number,
): Promise<Uint8Array> {
	const subtle = crypto.subtle;
	const hkdfKey = await subtle.importKey("raw", source, "HKDF", false, [
		"deriveBits",
	]);
	const derivedBits = await subtle.deriveBits(
		{
			name: "HKDF",
			hash: "SHA-256",
			salt: salt ?? new Uint8Array([]),
			info: info ?? new Uint8Array([]),
		},
		hkdfKey,
		length * 8,
	);
	return new Uint8Array(derivedBits);
}

export function keyGen(args: { seed: Uint8Array }) {
	const { seed } = args;

	if (seed.length !== 32) {
		throw new Error("Seed must be 32 bytes");
	}

	const privateKey = seed;
	const publicKey = x25519.getPublicKey(privateKey);

	return {
		publicKey: new Uint8Array(publicKey),
		privateKey: new Uint8Array(privateKey),
	};
}

export type Wallet = WalletClient<Transport, Chain, Account>;

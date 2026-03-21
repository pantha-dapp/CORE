import { beforeAll, describe, expect, it } from "bun:test";
import {
	decrypt,
	eip712signature,
	encapsulate,
	encrypt,
	walletKeyGen,
} from "@pantha/contracts";
import { hexToBytes, keccak256, ripemd160, toHex } from "viem";
import { testGlobals } from "./helpers/globals";
import { unwrap } from "./helpers/rpc";
import { userWallet1, userWallet2 } from "./helpers/setup";

async function registerKeygen(
	api: (typeof testGlobals)["api1"],
	wallet: typeof userWallet1,
	contracts: (typeof testGlobals)["contracts1"],
) {
	const seedSalt = keccak256(crypto.getRandomValues(new Uint8Array(32)));
	const challengeSalt = ripemd160(crypto.getRandomValues(new Uint8Array(32)));

	// @ts-expect-error - types are wrong (same as hook)
	const keygen = await walletKeyGen(wallet, {
		salts: { seed: seedSalt, challenge: challengeSalt },
	});

	const signature = await eip712signature(contracts, "PanthaKeyStore", {
		types: {
			RegisterKeygenData: [
				{ name: "seedSalt", type: "bytes32" },
				{ name: "challengeSalt", type: "bytes20" },
				{ name: "publicKey", type: "bytes32" },
			],
		},
		primaryType: "RegisterKeygenData",
		message: {
			seedSalt,
			challengeSalt,
			publicKey: toHex(keygen.account.publicKey),
		},
	});

	const res = await unwrap(
		api.users.social.keygen.$post({
			json: {
				seedSalt: keygen.saltSeed,
				challengeSalt: keygen.saltChallenge,
				publicKey: toHex(keygen.account.publicKey),
				signature,
			},
		}),
	);

	await contracts.$publicClient.waitForTransactionReceipt({ hash: res.txHash });

	return keygen;
}

describe("Crypto primitives", () => {
	it("walletKeyGen is deterministic given same salts", async () => {
		const seedSalt = keccak256(new Uint8Array(32));
		const challengeSalt = ripemd160(new Uint8Array(32));

		// @ts-expect-error - types are wrong
		const a = await walletKeyGen(userWallet1, {
			salts: { seed: seedSalt, challenge: challengeSalt },
		});
		// @ts-expect-error - types are wrong
		const b = await walletKeyGen(userWallet1, {
			salts: { seed: seedSalt, challenge: challengeSalt },
		});

		expect(toHex(a.account.publicKey)).toBe(toHex(b.account.publicKey));
		expect(toHex(a.account.privateKey)).toBe(toHex(b.account.privateKey));
	});

	it("different salts produce different keys", async () => {
		const seedA = keccak256(new Uint8Array(32));
		const seedB = keccak256(new Uint8Array(31));
		const challenge = ripemd160(new Uint8Array(32));

		// @ts-expect-error - types are wrong
		const a = await walletKeyGen(userWallet1, {
			salts: { seed: seedA, challenge },
		});
		// @ts-expect-error - types are wrong
		const b = await walletKeyGen(userWallet1, {
			salts: { seed: seedB, challenge },
		});

		expect(toHex(a.account.publicKey)).not.toBe(toHex(b.account.publicKey));
	});

	it("encrypt/decrypt round-trips plaintext", async () => {
		const secretKey = crypto.getRandomValues(new Uint8Array(32));
		const plaintext = "hello pantha";
		const encoded = new TextEncoder().encode(plaintext);

		const ciphertext = await encrypt({ message: encoded, secretKey });
		const decrypted = await decrypt({ ciphertext, secretKey });

		expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
	});

	it("decrypt fails with wrong key", async () => {
		const key1 = crypto.getRandomValues(new Uint8Array(32));
		const key2 = crypto.getRandomValues(new Uint8Array(32));
		const ciphertext = await encrypt({
			message: new TextEncoder().encode("secret"),
			secretKey: key1,
		});

		expect(decrypt({ ciphertext, secretKey: key2 })).rejects.toThrow();
	});

	it("ECDH shared secrets match between two parties", async () => {
		const seedA = keccak256(new Uint8Array(32));
		const seedB = keccak256(new Uint8Array(31));
		const challenge = ripemd160(new Uint8Array(32));

		// @ts-expect-error - types are wrong
		const keyA = await walletKeyGen(userWallet1, {
			salts: { seed: seedA, challenge },
		});
		// @ts-expect-error - types are wrong
		const keyB = await walletKeyGen(userWallet2, {
			salts: { seed: seedB, challenge },
		});

		const { sharedSecret: ssA } = encapsulate({
			publicKeyOther: keyB.account.publicKey,
			privateKeySelf: keyA.account.privateKey,
		});
		const { sharedSecret: ssB } = encapsulate({
			publicKeyOther: keyA.account.publicKey,
			privateKeySelf: keyB.account.privateKey,
		});

		expect(toHex(ssA)).toBe(toHex(ssB));
	});

	it("E2E: encrypt with recipient public key, decrypt with recipient private key", async () => {
		const seedA = keccak256(new Uint8Array(32));
		const seedB = keccak256(new Uint8Array(31));
		const challenge = ripemd160(new Uint8Array(32));

		// @ts-expect-error - types are wrong
		const sender = await walletKeyGen(userWallet1, {
			salts: { seed: seedA, challenge },
		});
		// @ts-expect-error - types are wrong
		const recipient = await walletKeyGen(userWallet2, {
			salts: { seed: seedB, challenge },
		});

		const { sharedSecret: senderSS } = encapsulate({
			publicKeyOther: recipient.account.publicKey,
			privateKeySelf: sender.account.privateKey,
		});
		const { sharedSecret: recipientSS } = encapsulate({
			publicKeyOther: sender.account.publicKey,
			privateKeySelf: recipient.account.privateKey,
		});

		const message = "end-to-end encrypted";
		const ciphertext = await encrypt({
			message: new TextEncoder().encode(message),
			secretKey: senderSS,
		});
		const decrypted = await decrypt({ ciphertext, secretKey: recipientSS });

		expect(new TextDecoder().decode(decrypted)).toBe(message);
	});
});

describe("Keygen route + PanthaKeyStore contract", () => {
	let keygen1: Awaited<ReturnType<typeof registerKeygen>>;
	let keygen2: Awaited<ReturnType<typeof registerKeygen>>;

	beforeAll(async () => {
		const { api1, contracts1, api2, contracts2 } = testGlobals;
		keygen1 = await registerKeygen(api1, userWallet1, contracts1);
		keygen2 = await registerKeygen(api2, userWallet2, contracts2);
	}, 60_000);

	it("user1 is registered on PanthaKeyStore after keygen route", async () => {
		const { contracts1 } = testGlobals;
		const isRegistered = await contracts1.PanthaKeyStore.read.isRegistered([
			userWallet1.account.address,
		]);
		expect(isRegistered).toBe(true);
	});

	it("on-chain keygenData publicKey matches what was submitted for user1", async () => {
		const { contracts1 } = testGlobals;
		const onChain = await contracts1.PanthaKeyStore.read.keygenData([
			userWallet1.account.address,
		]);
		expect(onChain[2]).toBe(toHex(keygen1.account.publicKey));
	});

	it("user2 is registered on PanthaKeyStore after keygen route", async () => {
		const { contracts1 } = testGlobals;
		const isRegistered = await contracts1.PanthaKeyStore.read.isRegistered([
			userWallet2.account.address,
		]);
		expect(isRegistered).toBe(true);
	});

	it("on-chain keygenData publicKey matches what was submitted for user2", async () => {
		const { contracts1 } = testGlobals;
		const onChain = await contracts1.PanthaKeyStore.read.keygenData([
			userWallet2.account.address,
		]);
		expect(onChain[2]).toBe(toHex(keygen2.account.publicKey));
	});

	it("key derivation from on-chain salts reproduces the same keypair", async () => {
		const { contracts1 } = testGlobals;
		const onChain = await contracts1.PanthaKeyStore.read.keygenData([
			userWallet1.account.address,
		]);

		// @ts-expect-error - types are wrong
		const rederived = await walletKeyGen(userWallet1, {
			salts: { seed: onChain[0], challenge: onChain[1] },
		});

		expect(toHex(rederived.account.publicKey)).toBe(onChain[2]);
	});

	it("E2E: user1 encrypts for user2 using on-chain public keys, user2 decrypts", async () => {
		const { contracts1 } = testGlobals;

		const data1 = await contracts1.PanthaKeyStore.read.keygenData([
			userWallet1.account.address,
		]);
		const data2 = await contracts1.PanthaKeyStore.read.keygenData([
			userWallet2.account.address,
		]);

		const pubKey2 = hexToBytes(data2[2] as `0x${string}`);

		const { sharedSecret: senderSecret } = encapsulate({
			publicKeyOther: pubKey2,
			privateKeySelf: keygen1.account.privateKey,
		});

		const plaintext = "pantha encrypted dm";
		const ciphertext = await encrypt({
			message: new TextEncoder().encode(plaintext),
			secretKey: senderSecret,
		});

		const pubKey1 = hexToBytes(data1[2] as `0x${string}`);
		const { sharedSecret: recipientSecret } = encapsulate({
			publicKeyOther: pubKey1,
			privateKeySelf: keygen2.account.privateKey,
		});

		const decrypted = await decrypt({ ciphertext, secretKey: recipientSecret });
		expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
	});
});

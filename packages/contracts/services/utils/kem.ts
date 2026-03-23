import { x25519 } from "@noble/curves/ed25519.js";

export function encapsulate(args: {
	publicKeyOther: Uint8Array;
	privateKeySelf: Uint8Array;
}) {
	const { publicKeyOther, privateKeySelf } = args;

	const sharedSecret = x25519.getSharedSecret(privateKeySelf, publicKeyOther);

	return {
		sharedSecret: new Uint8Array(sharedSecret),
	};
}

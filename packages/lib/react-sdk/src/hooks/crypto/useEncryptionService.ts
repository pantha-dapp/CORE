import {
	decrypt as _decrypt,
	encrypt as _encrypt,
	encapsulate,
} from "@pantha/contracts";
import { useEffect } from "react";
import { type Address, hexToBytes } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";
import { idb } from "../../utils/idb";
import { useGetKeygenData } from "./useGetKeygenData";
import { useSetKeygenData } from "./useSetKeygenData";

const pubKeyCache = idb({ db: "pantha", store: "pubkey-cache" });

export function useEncryptionService() {
	const { wallet, contracts } = usePanthaContext();

	const setKeygenData = useSetKeygenData();
	const storedKeygenData = useGetKeygenData();

	useEffect(() => {
		if (storedKeygenData.data?.registered === false) {
			setKeygenData.mutate();
		}
	}, [storedKeygenData.data]);

	async function getPublicKey(walletAddress: Address) {
		const cached = await pubKeyCache.get<`0x${string}`>(walletAddress);
		if (cached) return cached;

		if (!contracts || !wallet) {
			throw new Error("Contracts or wallet not available");
		}

		const isRegistered = await contracts.PanthaKeyStore.read.isRegistered([
			walletAddress,
		]);
		if (!isRegistered) {
			throw new Error("recipient public key not found");
		}

		const keygenData = await contracts.PanthaKeyStore.read.keygenData([
			walletAddress,
		]);
		const publicKey = keygenData[2] as `0x${string}`;

		await pubKeyCache.put(walletAddress, publicKey);
		return publicKey;
	}

	async function encrypt(args: {
		recipientAddress: Address;
		plaintext: string;
	}) {
		if (!wallet || !contracts) {
			throw new Error("not connected");
		}
		if (!storedKeygenData.data?.registered) {
			throw new Error("keygen data not registered");
		}
		if (!storedKeygenData.data.keygen) {
			throw new Error("stored keygen data not found");
		}

		const publicKey = await getPublicKey(args.recipientAddress);
		const { sharedSecret } = encapsulate({
			publicKeyOther: hexToBytes(publicKey),
			privateKeySelf: storedKeygenData.data.keygen.account.privateKey,
		});
		return _encrypt({
			message: new TextEncoder().encode(args.plaintext),
			secretKey: sharedSecret,
		});
	}

	async function decrypt(args: {
		senderAddress: Address;
		ciphertext: Uint8Array;
	}) {
		if (!wallet || !contracts) {
			throw new Error("not connected");
		}
		if (!storedKeygenData.data?.keygen) {
			throw new Error("keygen data not found");
		}

		const publicKey = await getPublicKey(args.senderAddress);
		const { sharedSecret } = encapsulate({
			publicKeyOther: hexToBytes(publicKey),
			privateKeySelf: storedKeygenData.data.keygen.account.privateKey,
		});
		const plaintext = await _decrypt({
			ciphertext: args.ciphertext,
			secretKey: sharedSecret,
		});
		return new TextDecoder().decode(plaintext);
	}

	return {
		encrypt,
		decrypt,
	};
}

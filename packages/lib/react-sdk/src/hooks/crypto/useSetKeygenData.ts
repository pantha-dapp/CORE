import { eip712signature, walletKeyGen } from "@pantha/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { keccak256, ripemd160, toHex } from "viem";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useSetKeygenData() {
	const queryclient = useQueryClient();
	const { wallet, contracts, api } = usePanthaContext();

	return useMutation({
		mutationFn: async () => {
			if (!wallet || !contracts) {
				throw new Error("not connected");
			}

			const seedSalt = keccak256(crypto.getRandomValues(new Uint8Array(32)));
			const challengeSalt = ripemd160(
				crypto.getRandomValues(new Uint8Array(32)),
			);
			//@ts-expect-error - types are wrong
			const keygen = await walletKeyGen(wallet, {
				salts: {
					challenge: challengeSalt,
					seed: seedSalt,
				},
			});

			const _signature = await eip712signature(contracts, "PanthaKeyStore", {
				types: {
					RegisterKeygenData: [
						{ name: "seedSalt", type: "bytes32" },
						{ name: "challengeSalt", type: "bytes20" },
						{ name: "publicKey", type: "bytes32" },
					],
				},
				primaryType: "RegisterKeygenData",
				message: {
					seedSalt: seedSalt,
					challengeSalt: challengeSalt,
					publicKey: toHex(keygen.account.publicKey),
				},
			});

			const response = await parseResponse(
				api.rpc.users.social.keygen.$post({
					json: {
						seedSalt: keygen.saltSeed,
						challengeSalt: keygen.saltChallenge,
						publicKey: toHex(keygen.account.publicKey),
						signature: _signature,
					},
				}),
			);
			if (!response.success) {
				console.error("Failed to set keygen data", response);
				throw new Error("Failed to set keygen data");
			}

			if (!response.data.txHash || response.data.alreadyRegistered) {
				// Data already registered on-chain — refresh from contract
				queryclient.invalidateQueries({
					queryKey: [
						"keygenData",
						contracts.PanthaKeyStore.address,
						wallet.account.address,
					],
				});
				return response.data;
			}

			const receipt = await contracts.$publicClient.waitForTransactionReceipt({
				hash: response.data.txHash,
			});

			if (receipt.status !== "success") {
				return receipt;
			}
			queryclient.invalidateQueries({
				queryKey: [
					"keygenData",
					contracts.PanthaKeyStore.address,
					wallet.account.address,
				],
			});
			queryclient.refetchQueries({
				queryKey: [
					"keygenData",
					contracts?.PanthaKeyStore.address,
					wallet?.account.address,
				],
			});

			return response.data;
		},
	});
}

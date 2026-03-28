import { concat, type Hex, keccak256 } from "viem";

/**
 * Computes a binary Merkle root from an array of 32-byte hex leaves.
 * Pairs are sorted before hashing to match OpenZeppelin MerkleProof ordering.
 */
export function computeMerkleRoot(leaves: Hex[]): Hex {
	if (leaves.length === 0) {
		return keccak256("0x");
	}

	let layer: Hex[] = [...leaves];

	while (layer.length > 1) {
		const nextLayer: Hex[] = [];

		for (let i = 0; i < layer.length; i += 2) {
			const left = layer[i] as Hex;
			const right = (layer[i + 1] ?? layer[i]) as Hex; // duplicate last if odd

			// Sort pair lexicographically to ensure deterministic ordering
			const [a, b]: [Hex, Hex] = left <= right ? [left, right] : [right, left];
			nextLayer.push(keccak256(concat([a, b])));
		}

		layer = nextLayer;
	}

	return layer[0] as Hex;
}

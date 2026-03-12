export interface NFTAttribute {
	trait_type: string;
	value: string | number;
}

export interface NFTMetadata {
	name: string;
	description?: string;
	image?: string;
	external_url?: string;
	attributes?: NFTAttribute[];
}

export function createNFTMetadata(data: NFTMetadata) {
	return {
		name: data.name,
		description: data.description ?? "",
		image: data.image ?? "",
		external_url: data.external_url ?? "",
		attributes: data.attributes ?? [],
	};
}

export function metadataToBuffer(metadata: NFTMetadata) {
	return Buffer.from(JSON.stringify(metadata));
}

import sharp from "sharp";

export async function pngBufferToCompressedWebpBuffer(
	input: Buffer,
	options?: {
		maxWidth?: number;
		quality?: number;
	},
): Promise<Buffer> {
	return await sharp(input)
		.webp({
			quality: 80,
			effort: 4,
		})
		.resize({
			width: options?.maxWidth,
			withoutEnlargement: true,
		})
		.toBuffer();
}

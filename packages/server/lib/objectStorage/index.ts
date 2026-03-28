export interface ObjectStorageAdapter {
	upload: (
		key: ObjectStorageResourceKey,
		args: { path: string[]; data: Buffer },
	) => Promise<{ url: string }>;
	delete: (args: { path: string[] }) => Promise<void>;
}

type ObjectStorageResourceDef = {
	key: string;
	name: string;
	contentType: string;
	maxSizeBytes: number;
};

export const ObjectStorageResourceDefs = [
	{
		name: "courseIcon",
		key: "course-icons",
		contentType: "image/webp",
		maxSizeBytes: 5 * 1024 * 1024, // 5MB
	},
	{
		name: "pageImages",
		key: "chapter-page-images",
		contentType: "image/webp",
		maxSizeBytes: 10 * 1024 * 1024, // 5MB
	},
	{
		name: "certificationMetadata",
		key: "certification-metadata",
		contentType: "application/json",
		maxSizeBytes: 100 * 1024, // 100KB
	},
	{
		name: "actionHashChain",
		key: "action-hash-chain",
		contentType: "application/json",
		maxSizeBytes: 5 * 1024 * 1024, // 5MB
	},
] as const satisfies readonly ObjectStorageResourceDef[];

export type ObjectStorageResourceKey =
	(typeof ObjectStorageResourceDefs)[number]["key"];

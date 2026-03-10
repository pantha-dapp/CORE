export interface ObjectStorageAdapter {
	upload: (
		key: string,
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

export const ObjectStorageResourceDefs: ObjectStorageResourceDef[] = [
	{
		name: "courseIcon",
		key: "course-icons",
		contentType: "image/webp",
		maxSizeBytes: 5 * 1024 * 1024, // 5MB
	},
];

export type ObjectStorageResourceKey =
	(typeof ObjectStorageResourceDefs)[number]["key"];

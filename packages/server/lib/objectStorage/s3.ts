import { S3Client } from "bun";
import {
	type ObjectStorageAdapter,
	ObjectStorageResourceDefs,
	type ObjectStorageResourceKey,
} from ".";

type S3ObjectStorageConfig = {
	rootDir: string[];
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	endpoint: string;
};
export class S3ObjectStorage implements ObjectStorageAdapter {
	private _config: S3ObjectStorageConfig;

	constructor(config: S3ObjectStorageConfig) {
		this._config = config;
	}

	get $s3() {
		return new S3Client({
			accessKeyId: this._config.accessKeyId,
			secretAccessKey: this._config.secretAccessKey,
			endpoint: this._config.endpoint,
			bucket: this._config.bucket,
		});
	}

	file(path: string[]) {
		return this.$s3.file([...this._config.rootDir, ...path].join("/"));
	}

	async upload(
		key: ObjectStorageResourceKey,
		args: { path: string[]; data: Buffer },
	) {
		const { path, data } = args;
		const def = ObjectStorageResourceDefs.find((def) => def.key === key);
		if (!def) {
			throw new Error(`Invalid object storage resource key: ${key}`);
		}
		if (data.length > def.maxSizeBytes) {
			throw new Error(
				`File size exceeds maximum of ${def.maxSizeBytes} bytes for resource type ${key}`,
			);
		}

		const file = this.file([def.key, ...path]);

		await file.write(data);

		const url = file.presign();

		return { url };
	}

	async delete(args: { path: string[] }) {
		const { path } = args;
		const file = this.file(path);
		await file.delete();
	}
}

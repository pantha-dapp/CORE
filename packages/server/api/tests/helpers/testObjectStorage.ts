import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { ObjectStorageResourceKey } from "../../../lib/objectStorage";
import { S3ObjectStorage } from "../../../lib/objectStorage/s3";
import type { IObjectStorageService } from "../../../lib/objectStorage/service";
import { FilecoinSynapseObjectStorage } from "../../../lib/objectStorage/synapse";

export class TestSynapseAdapter extends FilecoinSynapseObjectStorage {
	constructor() {
		super({
			account: privateKeyToAccount(generatePrivateKey()),
			environment: "test",
			source: "pantha-test-suite",
		});
	}

	override upload(
		key: ObjectStorageResourceKey,
		_args: { path: string[]; data: Buffer },
	): Promise<{ url: string }> {
		return Promise.resolve({ url: `https://mock-synapse/${key}` });
	}
}

export class TestS3Adapter extends S3ObjectStorage {
	constructor() {
		super({
			accessKeyId: "test",
			bucket: "Test",
			endpoint: "http://localhost:9000",
			secretAccessKey: "test",
			rootDir: ["test-suite"],
		});
	}

	override upload(
		key: ObjectStorageResourceKey,
		_args: { path: string[]; data: Buffer },
	): Promise<{ url: string }> {
		return Promise.resolve({ url: `https://mock-s3/${key}` });
	}
}

export class TestObjectStorageService implements IObjectStorageService {
	private s3: S3ObjectStorage;
	private synapse: TestSynapseAdapter;

	constructor() {
		this.s3 = new TestS3Adapter();
		this.synapse = new TestSynapseAdapter();
	}

	upload(args: {
		path: [ObjectStorageResourceKey, ...string[]];
		data: Buffer;
	}) {
		const hotStorageResultPromise = this.s3.upload(args.path[0], {
			path: args.path.slice(1),
			data: args.data,
		});
		const persistentStorageResultPromise = this.synapse.upload(args.path[0], {
			path: args.path.slice(1),
			data: args.data,
		});

		return {
			hotStorage: hotStorageResultPromise,
			persistentStorage: persistentStorageResultPromise,
		};
	}

	async unloadHot(_args: { path: [ObjectStorageResourceKey, ...string[]] }) {
		// Mock implementation - do nothing
	}
}

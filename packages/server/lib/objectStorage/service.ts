import { S3ObjectStorage } from "./s3";
import { FilecoinSynapseObjectStorage } from "./synapse";

export interface IObjectStorageService {
	upload: (args: { path: string[]; data: Buffer }) => {
		hotStorage: Promise<{ url: string }>;
		persistentStorage: Promise<{ url: string }>;
	};
	unloadHot: (args: { path: string[] }) => Promise<void>;
}

export class ObjectStorageService implements IObjectStorageService {
	private s3: S3ObjectStorage;
	private synapse: FilecoinSynapseObjectStorage;

	constructor(config: {
		s3: ConstructorParameters<typeof S3ObjectStorage>[0];
		synapse: ConstructorParameters<typeof FilecoinSynapseObjectStorage>[0];
	}) {
		this.s3 = new S3ObjectStorage(config.s3);
		this.synapse = new FilecoinSynapseObjectStorage(config.synapse);
	}

	upload(args: { path: string[]; data: Buffer }) {
		const { path, data } = args;

		const hotStorageResultPromise = this.s3.upload("hot_storage_key", {
			path,
			data,
		});
		const persistentStorageResultPromise = this.synapse.upload(
			"persistent_storage_key",
			{ path, data },
		);

		return {
			hotStorage: hotStorageResultPromise,
			persistentStorage: persistentStorageResultPromise,
		};
	}

	async unloadHot(args: { path: string[] }) {
		await this.s3.delete({ path: args.path });
	}
}

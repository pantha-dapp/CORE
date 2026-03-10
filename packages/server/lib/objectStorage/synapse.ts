import { calibration, Synapse } from "@filoz/synapse-sdk";
import { type Account, http } from "viem";
import { NotImplementedError } from "../errors";
import {
	type ObjectStorageAdapter,
	ObjectStorageResourceDefs,
	type ObjectStorageResourceKey,
} from ".";

const WITH_CDN = true;

type FilecoinSynapseObjectStorageConfig = {
	account: Account;
	environment: "prod" | "dev" | "test";
	source: string;
};
export class FilecoinSynapseObjectStorage implements ObjectStorageAdapter {
	private _config: FilecoinSynapseObjectStorageConfig;

	constructor(config: FilecoinSynapseObjectStorageConfig) {
		this._config = config;
	}

	get $synapse() {
		return Synapse.create({
			account: this._config.account,
			source: this._config.source,
			withCDN: WITH_CDN,

			/// this is temporarily hardcoded, do a better job at fetching this dynamically during runtime
			transport: http(calibration.rpcUrls.default.http[0]),
		});
	}

	async ctx(key: ObjectStorageResourceKey) {
		const def = ObjectStorageResourceDefs.find((def) => def.key === key);
		if (!def) {
			throw new Error(`Invalid object storage resource key: ${key}`);
		}

		const ctx = await this.$synapse.storage.createContext({
			metadata: {
				source: this._config.source,
				environment: this._config.environment,
				contentType: def.contentType,
			},
		});

		return ctx;
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
		const pathStr = [def.key, ...path].join("/");

		const ctx = await this.ctx(key);

		const { pieceCid } = await ctx.upload(data, {
			pieceMetadata: {
				filepath: pathStr,
			},
		});

		const cdnUrl = `https://${this.$synapse.client.account.address}.calibration.filbeam.io/${pieceCid}`;

		return { url: cdnUrl };
	}

	async delete() {
		// not sure if we can implement this with synapse, seems like we might not be able to since we only get a pieceCid back from the upload response and not a full file path or object key that we can use to identify and delete the object later - need to investigate more
		throw new NotImplementedError(
			"Delete is not implemented for FilecoinSynapseObjectStorage",
		);
	}
}

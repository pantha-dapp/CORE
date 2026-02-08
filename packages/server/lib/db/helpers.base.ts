import { jsonParse, jsonStringify } from "@pantha/shared";
import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/sqlite-core";
import { customType, int } from "drizzle-orm/sqlite-core";
import {
	type Address,
	checksumAddress,
	getAddress,
	type Hash,
	type Hex,
	isAddress,
	isHash,
	isHex,
} from "viem";

export const timestamps = {
	createdAt: int("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: int("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	deletedAt: int("deleted_at", { mode: "timestamp" }),
};

export const tUuid = (columnName?: string) =>
	t.text(columnName).$defaultFn(() => Bun.randomUUIDv7());

export const tEvmAddress = customType<{
	data: Address;
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	toDriver(value) {
		if (!isAddress(value)) {
			throw new Error(`Invalid EVM address: ${value}`);
		}
		return checksumAddress(value);
	},
	fromDriver(value) {
		return getAddress(value);
	},
});

// TODO please remove
export const tJsonString = customType<{
	data: Record<string, unknown>;
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	toDriver(value) {
		return jsonStringify(value);
	},
	fromDriver(value) {
		return jsonParse(value);
	},
});

export const tBytes32 = customType<{
	data: Hash;
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	toDriver(value) {
		if (!isHash(value)) {
			throw new Error(`Invalid hash: ${value}`);
		}
		return value;
	},
	fromDriver(value) {
		if (!isHex(value)) {
			throw new Error(`Invalid hex: ${value}`);
		}
		return value;
	},
});

export const tHex = customType<{
	data: Hex;
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	toDriver(value) {
		if (!isHex(value)) {
			throw new Error(`Invalid hex: ${value}`);
		}
		return value;
	},
	fromDriver(value) {
		if (!isHex(value)) {
			throw new Error(`Invalid hex: ${value}`);
		}
		return value;
	},
});

// TODO please reconsider

export const tBigInt = customType<{
	data: bigint;
	driverData: string;
}>({
	dataType() {
		return "text";
	},
	toDriver(value) {
		return value.toString();
	},
	fromDriver(value) {
		return BigInt(value);
	},
});

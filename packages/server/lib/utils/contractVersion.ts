import { and, eq } from "drizzle-orm";
import type { Address } from "viem";
import type { Db } from "../db";
import type schema from "../db/schema";

type Type = typeof schema.contractVersions.$inferInsert.type;
const versionCache: Record<Type, number> = {
	pxp: -1,
	shop: -1,
	token: -1,
};

export async function getContractVersionId(config: {
	db: Db;
	type: Type;
	contractAddress: Address;
}) {
	const { db, type, contractAddress } = config;

	if (versionCache[config.type] === -1) {
		const [version] = await db
			.select()
			.from(db.schema.contractVersions)
			.where(
				and(
					eq(db.schema.contractVersions.type, type),
					eq(db.schema.contractVersions.contractAddress, contractAddress),
				),
			)
			.limit(1);
		if (version) {
			versionCache[type] = version.id;
		} else {
			const [newVersion] = await db
				.insert(db.schema.contractVersions)
				.values({
					type: type,
					contractAddress: contractAddress,
				})
				.returning();
			if (newVersion) {
				versionCache[type] = newVersion.id;
			} else {
				throw new Error("Failed to insert new version into database");
			}
		}
	}

	return versionCache[type];
}

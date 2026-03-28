import { and, eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../errors";
import type { Enforcers } from ".";

const enforcers: Enforcers<"shop"> = {
	"shop.purchase": async (user, resource, app) => {
		const { db } = app;
		const activePurchases = await db
			.select()
			.from(db.schema.userPurchases)
			.where(
				and(
					eq(db.schema.userPurchases.userWallet, user),
					eq(db.schema.userPurchases.itemId, resource.itemId),
					eq(db.schema.userPurchases.consumed, 0),
				),
			);

		switch (resource.itemId) {
			case "STRKFRZ0": {
				if (activePurchases?.length) {
					throw new ConflictError("You have already purchased this item.");
				}

				return true;
			}
			case "CERTIFCT": {
				if (activePurchases?.length) {
					throw new ConflictError(
						"You already have an unused certificate. Use it before purchasing another.",
					);
				}

				return true;
			}
			default:
				throw new NotFoundError("Shop item not found");
		}
	},
};

export default enforcers;

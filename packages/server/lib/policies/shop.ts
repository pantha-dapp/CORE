import { and, eq } from "drizzle-orm";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors";
import type { Enforcers } from ".";

const enforcers: Enforcers<"shop"> = {
	"shop.purchase": async (user, resource, app) => {
		const { db } = app;
		const activePurchase = db
			.select()
			.from(db.schema.userPurchases)
			.where(
				and(
					eq(db.schema.userPurchases.userWallet, user),
					eq(db.schema.userPurchases.itemId, resource.itemId),
					eq(db.schema.userPurchases.consumed, 0),
				),
			)
			.get();

		switch (resource.itemId) {
			case "STRKFRZ0": {
				if (activePurchase) {
					throw new ConflictError("You have already purchased this item.");
				}

				break;
			}
			default:
				throw new NotFoundError("Shop item not found");
		}

		throw new UnauthorizedError(
			"You do not have permission to view this user's profile.",
		);
	},
};

export default enforcers;

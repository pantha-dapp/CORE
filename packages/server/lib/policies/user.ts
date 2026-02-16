import { NotFoundError, UnauthorizedError } from "../errors";
import type { Enforcers } from ".";

const enforcers: Enforcers<"user"> = {
	"user.view": async (user, resource, app) => {
		const { db } = app;

		if (user === resource.userWallet) return true;

		const target = await db.userByWallet({ userWallet: resource.userWallet });
		if (!target) throw new NotFoundError("User not found.");

		if (target.profileVisibility === "public") return true;

		const isFollowing = await db.isUserFollowing({
			userWallet: user,
			targetWallet: resource.userWallet,
		});
		if (isFollowing) return true;

		throw new UnauthorizedError(
			"You do not have permission to view this user's profile.",
		);
	},

	"user.follow": async (user, resource, app) => {
		const { db } = app;

		if (user === resource.userWallet)
			throw new UnauthorizedError("You cannot follow yourself.");

		const target = await db.userByWallet({ userWallet: resource.userWallet });
		if (!target) throw new NotFoundError("User not found.");

		throw new UnauthorizedError(
			"You do not have permission to follow this user.",
		);
	},
};

export default enforcers;

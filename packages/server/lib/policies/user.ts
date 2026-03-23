import { BadRequestError, ForbiddenError, NotFoundError } from "../errors";
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

		throw new ForbiddenError("This profile is private.");
	},

	"user.follow": async (user, resource, app) => {
		const { db } = app;

		if (user === resource.userWallet)
			throw new BadRequestError("You cannot follow yourself.");

		const target = await db.userByWallet({ userWallet: resource.userWallet });
		if (!target) throw new NotFoundError("User not found.");

		if (target.followPolicy === "anyone") return true;

		throw new ForbiddenError("You do not have permission to follow this user.");
	},

	"user.unfollow": async (user, resource, app) => {
		const { db } = app;

		if (user === resource.userWallet)
			throw new ForbiddenError("You cannot unfollow yourself.");

		const target = await db.userByWallet({ userWallet: resource.userWallet });
		if (!target) throw new NotFoundError("User not found.");

		const isFollowing = await db.isUserFollowing({
			userWallet: user,
			targetWallet: resource.userWallet,
		});

		if (isFollowing) return true;

		throw new ForbiddenError(
			"You do not have permission to unfollow this user.",
		);
	},
};

export default enforcers;

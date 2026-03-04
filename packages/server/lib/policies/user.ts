import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors";
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
			throw new BadRequestError("You cannot follow yourself.");

		const target = await db.userByWallet({ userWallet: resource.userWallet });
		if (!target) throw new NotFoundError("User not found.");

		if (target.followPolicy === "anyone") return true;

		throw new UnauthorizedError(
			"You do not have permission to follow this user.",
		);
	},

	"user.unfollow": async (user, resource, app) => {
		const { db } = app;

		if (user === resource.userWallet)
			throw new UnauthorizedError("You cannot unfollow yourself.");

		const target = await db.userByWallet({ userWallet: resource.userWallet });
		if (!target) throw new NotFoundError("User not found.");

		const isFollowing = await db.isUserFollowing({
			userWallet: user,
			targetWallet: resource.userWallet,
		});

		if (isFollowing) return true;

		throw new UnauthorizedError(
			"You do not have permission to unfollow this user.",
		);
	},

	// Friends (mutual followers) can view each other's full profile.
	"user.viewFriendProfile": async (user, resource, app) => {
		const { db } = app;

		// Always allow viewing your own profile.
		if (user === resource.userWallet) return true;

		const target = await db.userByWallet({ userWallet: resource.userWallet });
		if (!target) throw new NotFoundError("User not found.");

		// Check mutual follow — both directions must exist.
		const [iFollowThem, theyFollowMe] = await Promise.all([
			db.isUserFollowing({
				userWallet: user,
				targetWallet: resource.userWallet,
			}),
			db.isUserFollowing({
				userWallet: resource.userWallet,
				targetWallet: user,
			}),
		]);

		if (iFollowThem && theyFollowMe) return true;

		throw new UnauthorizedError("Only mutual friends can view this profile.");
	},
};

export default enforcers;

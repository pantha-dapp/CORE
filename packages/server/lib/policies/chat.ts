import { NotFoundError, UnauthorizedError } from "../errors";
import type { Enforcers } from ".";

const enforcers: Enforcers<"chat"> = {
	"chat.dm": async (user, resource, app) => {
		const { db } = app;
		const recipientWallet = resource.userWallet;

		if (user === recipientWallet)
			throw new UnauthorizedError("You cannot message yourself.");

		const target = await db.userByWallet({ userWallet: recipientWallet });
		if (!target) throw new NotFoundError("User not found.");

		if (target.messagePolicy === "noone") {
			throw new UnauthorizedError("This user does not accept messages.");
		}

		const canMessage =
			target.messagePolicy === "anyone" ||
			(target.messagePolicy === "friends" &&
				(await db.isUserFriend({
					userWallet: user,
					targetWallet: recipientWallet,
				})));

		if (canMessage) return true;

		throw new UnauthorizedError(
			"You do not have permission to message this user.",
		);
	},
};

export default enforcers;

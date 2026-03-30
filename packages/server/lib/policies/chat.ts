import { ForbiddenError, NotFoundError } from "../errors";
import type { Enforcers } from ".";

const enforcers: Enforcers<"chat"> = {
	"chat.dm": async (user, resource, app) => {
		const { db } = app;
		const recipientWallet = resource.userWallet;

		if (user === recipientWallet)
			throw new ForbiddenError("You cannot message yourself.");

		const target = await db.userByWallet({ userWallet: recipientWallet });
		if (!target) throw new NotFoundError("User not found.");

		if (target.messagePolicy === "noone") {
			throw new ForbiddenError("This user does not accept messages.");
		}

		const canMessage =
			target.messagePolicy === "anyone" ||
			(target.messagePolicy === "friends" &&
				(await db.isUserFriend({
					userWallet: user,
					targetWallet: recipientWallet,
				})));

		if (canMessage) return true;

		throw new ForbiddenError(
			"You do not have permission to message this user.",
		);
	},

	"chat.group_access": async (user, resource, app) => {
		const { db } = app;
		const { learningGroupChatId } = resource;

		const groups = await db.getLearningGroupMembershipsOfUser({
			userWallet: user,
		});
		if (!groups) throw new NotFoundError("Chat group not found.");

		const isMember = groups.some(
			(group) => group.learningGroupChatId === learningGroupChatId,
		);

		if (isMember) return true;

		throw new ForbiddenError("You do not have access to this chat group.");
	},
};

export default enforcers;

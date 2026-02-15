import type { AppState } from "../../../../api/routes/types";

export default function (appState: AppState) {
	const { eventBus: event, db } = appState;

	event.on("user.logged_in", ({ walletAddress }) => {
		db.insert(db.schema.users)
			.values({ walletAddress: walletAddress, lastActiveAt: new Date() })
			.onConflictDoNothing();

		event.emit("user.registered", { walletAddress });
	});
}

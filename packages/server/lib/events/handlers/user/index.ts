import { eq } from "drizzle-orm";
import type { AppState } from "../../../../api/routes/types";

export default function (appState: AppState) {
	const { eventBus: event, db } = appState;

	event.on("user.logged_in", ({ walletAddress }) => {
		db.insert(db.schema.users)
			.values({ walletAddress: walletAddress, lastActiveAt: new Date() })
			.onConflictDoUpdate({
				target: db.schema.users.walletAddress,
				set: {
					lastActiveAt: new Date(),
				},
			})
			.then(async () => {
				db.select()
					.from(db.schema.users)
					.where(eq(db.schema.users.walletAddress, walletAddress))
					.then(([user]) => {
						if (user) {
							event.emit("user.registered", {
								walletAddress: user.walletAddress,
							});
						}
					});
			});
	});
}

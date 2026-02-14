import { createMiddleware } from "hono/factory";
import type { RouterEnv } from "../../routes/types";

export const setupEventHandlers = createMiddleware<RouterEnv>(
	async (ctx, next) => {
		const { db, eventBus } = ctx.var.appState;

		eventBus.on("user.login", async ({ walletAddress }) => {
			await db.insert(db.schema.users).values({
				walletAddress,
				lastActiveAt: new Date(),
			});
		});
	},
);

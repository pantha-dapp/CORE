import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiRouter } from "./api/routes/router";
import sockets from "./api/sockets";

export const app = new Hono()
	.use(logger())
	.route("/ws", sockets)
	.use(
		cors({
			origin: ["*"],
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			credentials: true,
		}),
	)
	.route("/api", apiRouter);

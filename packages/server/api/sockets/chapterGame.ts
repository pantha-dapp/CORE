import { jsonParse, jsonStringify } from "@pantha/shared";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { isAddress } from "viem";
import z from "zod";
import db from "../../lib/db";
import { authenticated } from "../middleware/auth";
import { validator } from "../middleware/validator";

type GameSession = {
	pages: (typeof db.schema.chapterPages.$inferSelect)[];
	currentPage: number;
	correct: number[];
	incorrect: number[];
};
const gameSessions: Record<string, GameSession> = {};

export default new Hono().get(
	"/:id",
	authenticated,
	validator("param", z.object({ id: z.string() })),
	upgradeWebSocket(async (ctx) => {
		const { userWallet } = ctx.var;
		if (
			!userWallet ||
			typeof userWallet !== "string" ||
			!isAddress(userWallet)
		) {
			throw new Error("User wallet not found");
		}
		console.log;
		const { id } = ctx.req.param();
		if (!id) {
			throw new Error("Chapter ID is required");
		}
		const chapter = db.chapterById({ chapterId: id });
		if (!chapter) {
			throw new Error("Chapter ID is wrogn");
		}

		if (!gameSessions[userWallet]) {
			const pages = await db.chapterPagesById({ chapterId: id });
			gameSessions[userWallet] = {
				pages,
				currentPage: 0,
				correct: [],
				incorrect: [],
			};
		}

		const session = gameSessions[userWallet];
		if (!session) {
			throw new Error("Session not found");
		}

		return {
			onMessage(event, ws) {
				const _data = z
					.object({
						answer: z.string(),
					})
					.parse(jsonParse(event.data.toString()));

				const currentPage = session.pages[session.currentPage];
				if (!currentPage) {
					ws.send(jsonStringify({ error: "Invalid page number" }));
					return;
				}

				switch (currentPage.content.type) {
					case "example_uses": {
					}
				}

				ws.send("Hello from server!");
			},
			onClose: () => {
				console.log("Connection closed");
			},
		};
	}),
);

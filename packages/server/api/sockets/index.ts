import { Hono } from "hono";
import chapterGame from "./chapterGame";

export default new Hono().route("/chapter-game", chapterGame);

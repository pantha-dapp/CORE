import { Hono } from "hono";
import { shopItems } from "../../../data/shop";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";

export default new Hono().get("/", authenticated, async (ctx) => {
	respond.ok(ctx, { items: shopItems }, "shopItems ", 200);
});

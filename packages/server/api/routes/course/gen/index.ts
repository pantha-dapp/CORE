import { Hono } from "hono";
import { respond } from "../../../../lib/utils/respond";

type GenerationState = {};
const SessionStore = new Map<string, GenerationState>();

export default new Hono().post("/session", async (ctx) => {
    const sessionId = crypto.randomUUID();
    SessionStore.set(sessionId, {});
    return respond.ok(ctx, { sessionId }, "Session created", 200);
});

import { hc } from "hono/client";
import type { app } from "../server";

// console.log(app.routes.filter((r) => r.basePath === "/api").map((r) => r.path));

const rpc = hc<typeof app>("/api");

console.log(Object.keys(rpc.api));

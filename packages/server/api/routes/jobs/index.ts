import type { RedisClient } from "bun";
import { Hono } from "hono";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";
import type { RouterEnv } from "../types";

type Job = {
	state: "pending" | "success" | "failed";
	error?: string;
};

function getJobStore(redis: RedisClient) {
	const identifier = (id: string) => `job:${id}`;

	async function set(id: string, job: Job) {
		await redis.set(identifier(id), JSON.stringify(job));
	}

	async function get(id: string): Promise<Job | null> {
		const data = await redis.get(identifier(id));
		return data ? JSON.parse(data) : null;
	}

	async function update(id: string, updates: Partial<Job>) {
		const job = await get(id);
		if (!job) return;
		const newJob = { ...job, ...updates };
		await set(id, newJob);
	}

	return { set, get, update };
}

export function createJob(redis: RedisClient, fn: () => Promise<void>): string {
	const jobStore = getJobStore(redis);
	const id = crypto.randomUUID();

	jobStore.set(id, { state: "pending" });

	fn()
		.then(() => {
			jobStore.update(id, { state: "success" });
		})
		.catch((err) => {
			console.error("Job failed:", err);
			jobStore.update(id, { state: "failed", error: String(err) });
		});

	return id;
}

export default new Hono<RouterEnv>().get("/:id", authenticated, async (ctx) => {
	const { db } = ctx.var.appState;
	const jobStore = getJobStore(db.redis);
	const { id } = ctx.req.param();

	const job = await jobStore.get(id);
	if (!job) {
		return respond.err(ctx, "Job not found", 404);
	}

	return respond.ok(
		ctx,
		{ state: job.state, error: job.error },
		"Job state retrieved successfully.",
		200,
	);
});

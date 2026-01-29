import { Hono } from "hono";
import { respond } from "../../../lib/utils/respond";
import { authenticated } from "../../middleware/auth";

type Job = {
	state: "pending" | "success" | "failed";
	error?: string;
};
const JobStorage: Record<string, Job> = {};

export function createJob(fn: () => Promise<void>): string {
	const id = crypto.randomUUID();
	JobStorage[id] = { state: "pending" };

	fn()
		.then(() => {
			const jobRecord = JobStorage[id];
			if (!jobRecord) return;

			jobRecord.state = "success";
		})
		.catch((err) => {
			console.error("Job failed:", err);

			const jobRecord = JobStorage[id];
			if (!jobRecord) return;

			jobRecord.state = "failed";
			jobRecord.error = String(err);
		});

	return id;
}

export default new Hono().get("/:id", authenticated, async (ctx) => {
	const { id } = ctx.req.param();

	const job = JobStorage[id];
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

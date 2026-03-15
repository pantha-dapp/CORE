import { spawn } from "node:child_process";

export class HardhatNode {
	private process?: ReturnType<typeof spawn>;

	async start() {
		return new Promise<void>((resolve) => {
			this.process = spawn("bun", ["hardhat:node"], {
				stdio: "pipe",
				cwd: new URL("../..", import.meta.url).pathname,
			});

			this.process.stdout?.on("data", (data) => {
				const text = data.toString();

				if (text.includes("Started HTTP and WebSocket JSON-RPC server")) {
					spawn("bun", ["contracts:migrate", "--network", "localhost"], {
						stdio: "inherit",
						cwd: new URL("../..", import.meta.url).pathname,
					});

					resolve();
				}
			});
		});
	}

	async stop() {
		if (!this.process) return;
		this.process.kill("SIGINT");
	}
}

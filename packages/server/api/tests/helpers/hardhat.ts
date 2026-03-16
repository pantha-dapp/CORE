import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export class HardhatNode {
	private process?: ReturnType<typeof spawn>;
	private workspaceRoot: string;
	private logFilePath: string;
	private logStream?: fs.WriteStream;
	private processKilled = false;

	constructor() {
		// Calculate the workspace root from the current file location
		// hardhat.ts is at: packages/server/api/tests/helpers/hardhat.ts
		// We need to go up to: workspace root
		this.workspaceRoot = path.resolve(
			path.dirname(new URL(import.meta.url).pathname),
			"../../../../../",
		);
		this.logFilePath = path.resolve(this.workspaceRoot, "hardhat-test.log");

		// Create logs directory if it doesn't exist
		const logsDir = path.dirname(this.logFilePath);
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}

		// Clear previous log file
		fs.writeFileSync(this.logFilePath, "");
		this.logStream = fs.createWriteStream(this.logFilePath, { flags: "a" });
	}

	private writeLog(source: string, message: string) {
		const timestamp = new Date().toISOString();
		const logMessage = `[${timestamp}] [${source}] ${message}`;
		this.logStream?.write(`${logMessage}\n`);
	}

	async start() {
		return new Promise<void>((resolve, reject) => {
			this.process = spawn("bun", ["hardhat:node"], {
				stdio: "pipe",
				cwd: this.workspaceRoot,
			});

			let nodeStarted = false;

			this.process.stdout?.on("data", (data) => {
				const text = data.toString();
				this.writeLog("Hardhat Node", text.trim());

				if (
					!nodeStarted &&
					text.includes("Started HTTP and WebSocket JSON-RPC server")
				) {
					nodeStarted = true;
					console.log("✓ Hardhat node started");
					this.runMigration().then(resolve).catch(reject);
				}
			});

			this.process.stderr?.on("data", (data) => {
				const text = data.toString();
				this.writeLog("Hardhat Node Error", text.trim());
			});

			this.process.on("error", (err) => {
				this.writeLog("Hardhat Node", `Error: ${err.message}`);
				if (!this.processKilled) {
					reject(err);
				}
			});

			// Monitor for unexpected process exit
			this.process.on("exit", (code, signal) => {
				if (!this.processKilled && (code !== 0 || signal)) {
					const message = `Hardhat node exited unexpectedly with code ${code} and signal ${signal}`;
					this.writeLog("Hardhat Node", message);
					console.error(`✗ ${message}`);
				}
			});

			this.process.on("close", (code, signal) => {
				if (!this.processKilled && (code !== 0 || signal)) {
					const message = `Hardhat node closed unexpectedly with code ${code} and signal ${signal}. Check ${this.logFilePath} for details.`;
					this.writeLog("Hardhat Node", message);
					console.error(`✗ ${message}`);
				}
			});
		});
	}

	private async runMigration() {
		return new Promise<void>((resolve, reject) => {
			const migration = spawn(
				"bun",
				["contracts:migrate", "--network", "localhost"],
				{
					stdio: "pipe",
					cwd: this.workspaceRoot,
				},
			);

			let _output = "";

			migration.stdout?.on("data", (data) => {
				const text = data.toString();
				_output += text;
				this.writeLog("Migration", text.trim());
			});

			migration.stderr?.on("data", (data) => {
				const text = data.toString();
				_output += text;
				this.writeLog("Migration Error", text.trim());
			});

			migration.on("close", (code) => {
				if (code === 0) {
					console.log("✓ Contracts deployed");
					// Verify that definitions for chainId 31337 are available
					const definitionsPath = path.resolve(
						this.workspaceRoot,
						"packages/contracts/definitions.gen.ts",
					);
					const maxRetries = 10;
					let retries = 0;

					const checkDefinitions = () => {
						try {
							const content = fs.readFileSync(definitionsPath, "utf-8");
							if (content.includes("0x7a69")) {
								// 0x7a69 is 31337 in hex
								console.log(
									`✓ Contract definitions ready (log: ${this.logFilePath})\n`,
								);
								resolve();
							} else if (retries < maxRetries) {
								retries++;
								setTimeout(checkDefinitions, 500);
							} else {
								reject(
									new Error(
										"Timeout waiting for chainId 31337 definitions to be generated",
									),
								);
							}
						} catch (err) {
							reject(err);
						}
					};

					checkDefinitions();
				} else {
					this.writeLog("Migration", `Failed with code ${code}`);
					reject(
						new Error(
							`Migration failed with code ${code}. See ${this.logFilePath} for details.`,
						),
					);
				}
			});

			migration.on("error", (err) => {
				this.writeLog("Migration", `Error: ${err.message}`);
				reject(err);
			});
		});
	}

	async stop() {
		if (!this.process) return;
		this.processKilled = true;
		this.logStream?.end();

		// Try to gracefully kill the process
		if (!this.process.killed) {
			this.process.kill("SIGINT");

			// Wait a bit for graceful shutdown
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// If still running, force kill
			if (!this.process.killed) {
				this.process.kill("SIGKILL");
			}
		}
	}
}

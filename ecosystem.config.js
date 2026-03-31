module.exports = {
	apps: [
		{
			name: "pantha-web",
			script: "bun client:serve",
			cwd: ".",
			env_file: "./packages/server/.env",
			env: {
				NODE_ENV: "production",
			},
			env_production: {
				NODE_ENV: "production",
			},
		},
		{
			name: "pantha-server",
			script: "bun server:start",
			cwd: ".",
			env_file: "./packages/server/.env",
			env: {
				NODE_ENV: "production",
			},
		},
	],
};

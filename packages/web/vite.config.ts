import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		outDir: "dist",
	},
	resolve: {
		dedupe: ["react", "react-dom"],
	},
	server: {
		allowedHosts: [
			"untranscribed-miriam-hereditary.ngrok-free.dev",
			"pseudosyphilitic-neotenous-angle.ngrok-free.dev",
		],
		port: 31003,
		strictPort: true,
		proxy: {
			"/api": "http://localhost:31001",
			"/ws": "http://localhost:31001",
		},
	},
	preview: {
		allowedHosts: ["app.pantha.academy", "www.pantha.academy"],
		port: 31003,
		strictPort: true,
		proxy: {
			"/api": "http://localhost:31001",
			"/ws": "http://localhost:31001",
		},
	},
});

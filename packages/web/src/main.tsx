import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import router from "./pages/router";
import "./globals.css";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { wagmiConfig } from "./shared/config/wagmi";

// Root element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const queryClient = new QueryClient({ defaultOptions: {} });

// App
const App = () => {
	return (
		<StrictMode>
			<ErrorBoundary>
				<QueryClientProvider client={queryClient}>
					<PrivyProvider appId="cmfzj650r01rxkv0c8bap7wfr">
						<WagmiProvider config={wagmiConfig}>
							<RouterProvider router={router} />
							<Toaster position="bottom-right" />
						</WagmiProvider>
					</PrivyProvider>
				</QueryClientProvider>
			</ErrorBoundary>
		</StrictMode>
	);
};
const app = <App />;

//@ts-expect-error
BigInt.prototype.toJSON = function () {
	return this.toString();
};

createRoot(rootElement).render(app);

// Register service worker
if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/sw.js")
		.then((registration) => {
			console.log("SW registered: ", registration);
		})
		.catch((registrationError) => {
			console.log("SW registration failed: ", registrationError);
		});
}

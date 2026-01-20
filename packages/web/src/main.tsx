import "./globals.css";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import router from "./pages/router";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { privyConfig } from "./shared/config/privy";
import { wagmiConfig } from "./shared/config/wagmi";
import { PanthaProvider } from "./shared/contexts/AppWrapper";

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
					<PrivyProvider appId="cmkkwg9660061ju0ccbmggd59" config={privyConfig}>
						<WagmiProvider config={wagmiConfig}>
							<PanthaProvider>
								<RouterProvider router={router} />
								<Toaster position="bottom-right" />
							</PanthaProvider>
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
if ("serviceWorker" in navigator && !import.meta.env.DEV) {
	navigator.serviceWorker
		.register("/sw.js")
		.then((registration) => {
			console.log("SW registered: ", registration);
		})
		.catch((registrationError) => {
			console.log("SW registration failed: ", registrationError);
		});
}

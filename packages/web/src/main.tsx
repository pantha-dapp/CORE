import "./globals.css";
import { usePanthaContext } from "@pantha/react";
import { useLogout } from "@pantha/react/hooks";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, useRouter } from "@tanstack/react-router";
import { Buffer as BufferI } from "buffer";
import { StrictMode, useRef } from "react";
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

function AppWrapper(props: { children: React.ReactNode }) {
	const { api, ready } = usePanthaContext();
	const flag = useRef(false);
	const { mutate: logout } = useLogout();
	const router = useRouter();

	const privy = usePrivy();

	if (!flag.current && api) {
		flag.current = true;
		api.onResponse((res) => {
			if (res.status === 401) {
				queryClient.invalidateQueries();
				privy.logout();
				logout();
				router.navigate({ to: "/login", replace: true });
			}
		});
	}

	return <>{ready ? props.children : <>Loading SDK...</>}</>;
}

// App
const App = () => {
	return (
		<StrictMode>
			<ErrorBoundary>
				<PrivyProvider appId="cmkhe9jzt0126l70diykb112q" config={privyConfig}>
					<QueryClientProvider client={queryClient}>
						<WagmiProvider config={wagmiConfig}>
							<PanthaProvider>
								<AppWrapper>
									<RouterProvider router={router} />
									<Toaster position="bottom-right" />
								</AppWrapper>
							</PanthaProvider>
						</WagmiProvider>
					</QueryClientProvider>
				</PrivyProvider>
			</ErrorBoundary>
		</StrictMode>
	);
};
const app = <App />;

//@ts-expect-error
BigInt.prototype.toJSON = function () {
	return this.toString();
};

window.Buffer = window.Buffer || BufferI;

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

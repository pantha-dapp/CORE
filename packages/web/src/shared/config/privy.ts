import type { PrivyClientConfig } from "@privy-io/react-auth";
import { optimism } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
	appearance: {
		logo: "/logo.png",
		theme: "dark",
	},
	embeddedWallets: {
		ethereum: {
			createOnLogin: "users-without-wallets",
		},
	},
	supportedChains: [optimism],
};

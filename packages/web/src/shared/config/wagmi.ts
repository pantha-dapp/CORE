import { createConfig } from "@privy-io/wagmi";
import { optimism } from "viem/chains";
import { http } from "wagmi";

export const wagmiConfig = createConfig({
	chains: [optimism],
	transports: {
		[optimism.id]: http(),
	},
});

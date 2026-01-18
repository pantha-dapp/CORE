import { optimism } from "viem/chains";
import { createConfig, http } from "wagmi";

export const wagmiConfig = createConfig({
	chains: [optimism],
	transports: {
		[optimism.id]: http(),
	},
});

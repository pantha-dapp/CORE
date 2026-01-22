import { PanthaProvider as PanthaProviderBase } from "@pantha/react";
import { useWalletClient } from "wagmi";

export function PanthaProvider({ children }: { children: React.ReactNode }) {
	const { data: wallet } = useWalletClient();

	return (
		<PanthaProviderBase apiBaseUrl={"/"} wallet={wallet}>
			{children}
		</PanthaProviderBase>
	);
}

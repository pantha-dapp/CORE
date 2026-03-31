import { PanthaProvider as PanthaProviderBase, useEvent } from "@pantha/react";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";

export function PanthaProvider({ children }: { children: React.ReactNode }) {
	const { data: wallet } = useWalletClient();

	return (
		<PanthaProviderBase apiBaseUrl={"/"} wallet={wallet}>
			<NotificationsWrapper>{children}</NotificationsWrapper>
		</PanthaProviderBase>
	);
}

function NotificationsWrapper({ children }: { children: React.ReactNode }) {
	useEvent("dm:new", ({ from }) => {
		toast(`New message from ${from}`, {});
	});

	return <>{children}</>;
}

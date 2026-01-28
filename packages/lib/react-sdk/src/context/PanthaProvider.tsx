import { useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { UseWalletClientReturnType } from "wagmi";
import { idb } from "../utils/idb";
import ApiClient from "../utils/rpc";

type Wallet = UseWalletClientReturnType["data"];

type PanthaContext = {
	ready: boolean;
	api: ApiClient;
	wallet: Wallet;
};

const PanthaContext = createContext<PanthaContext>({
	ready: false,
	api: {} as ApiClient,
	wallet: undefined,
});

type PanthaConfig = {
	children: ReactNode;
	apiBaseUrl: string;
	wallet: Wallet | undefined;
};

const storage = idb({ db: "pantha", store: "auth" });

export function PanthaProvider(props: PanthaConfig) {
	const { children, apiBaseUrl, wallet } = props;
	const [ready, setReady] = useState(false);

	const api = useMemo(() => new ApiClient(apiBaseUrl), [apiBaseUrl]);

	const queryClient = useQueryClient();

	const flag = useRef(false);

	useEffect(() => {
		if (!flag.current && wallet && api) {
			flag.current = true;
			storage.get<string>("jwt").then((token) => {
				token && api.setJwt(token);
				setReady(true);
			});
		}
	}, [api, wallet]);

	const value: PanthaContext = useMemo(
		() => ({
			ready,
			wallet: wallet,
			api: api,
		}),
		[api, wallet],
	);

	return (
		<PanthaContext.Provider value={value}>{children}</PanthaContext.Provider>
	);
}

export function usePanthaContext() {
	return useContext(PanthaContext);
}

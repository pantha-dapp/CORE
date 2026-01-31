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
	const flag = useRef(false);

	const api = useMemo(() => new ApiClient(apiBaseUrl), [apiBaseUrl]);

	useEffect(() => {
		if (!flag.current) {
			if (api) {
				flag.current = true;
				storage.get<string>("jwt").then((token) => {
					if (token && typeof token === "string") {
						api.setJwt(token);
					}
					setReady(true);
				});
			}
		}
	}, [api]);

	const value: PanthaContext = useMemo(
		() => ({
			ready: ready,
			wallet: wallet,
			api: api,
		}),
		[api, wallet, ready],
	);

	return (
		<PanthaContext.Provider value={value}>{children}</PanthaContext.Provider>
	);
}

export function usePanthaContext() {
	return useContext(PanthaContext);
}

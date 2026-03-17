import { getContracts, type PanthaContracts } from "@pantha/contracts";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { flowTestnet } from "viem/chains";
import type { UseWalletClientReturnType } from "wagmi";
import { idb } from "../utils/idb";
import ApiClient from "../utils/rpc";

type Wallet = UseWalletClientReturnType["data"];

type PanthaContext = {
	ready: boolean;
	api: ApiClient;
	wallet: Wallet;
	contracts: PanthaContracts | undefined;
};

const PanthaContext = createContext<PanthaContext>({
	ready: false,
	api: {} as ApiClient,
	wallet: undefined,
	contracts: undefined,
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
	const contracts = useMemo(
		() =>
			wallet
				? getContracts({
						client: wallet,
						// @ts-expect-error viem hash collision from transitive dependencies
						chain: flowTestnet,
					})
				: undefined,
		[wallet],
	);

	useEffect(() => {
		if (!flag.current) {
			flag.current = true;
			storage.get<string>("jwt").then((token) => {
				if (token && typeof token === "string") {
					api.setJwt(token);
				}
				setReady(true);
			});
		}
	}, [api]);

	const value: PanthaContext = useMemo(
		() => ({
			ready: ready,
			wallet: wallet,
			api: api,
			contracts: contracts,
		}),
		[api, wallet, ready, contracts],
	);

	return (
		<PanthaContext.Provider value={value}>{children}</PanthaContext.Provider>
	);
}

export function usePanthaContext() {
	return useContext(PanthaContext);
}

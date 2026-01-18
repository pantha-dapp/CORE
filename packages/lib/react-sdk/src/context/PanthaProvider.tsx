import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from "react";
// import type { Chain } from "viem";
import type { UseWalletClientReturnType } from "wagmi";
import ApiClient from "../utils/rpc";

type Wallet = UseWalletClientReturnType["data"];

type PanthaContext = {
	ready: boolean;
	api: ApiClient;
	wallet: Wallet;
	// contracts: PanthaContracts | null;
	// runtime: Runtime;
};

const PanthaContext = createContext<PanthaContext>({
	ready: false,
	api: {} as ApiClient,
	wallet: undefined,
	// contracts: null,
	// runtime: {} as Runtime,
});

type PanthaConfig = {
	children: ReactNode;
	apiBaseUrl: string;
	wallet: Wallet | undefined;
};

export function PanthaProvider(props: PanthaConfig) {
	const { children, apiBaseUrl, wallet } = props;

	const api = useMemo(() => new ApiClient(apiBaseUrl), [apiBaseUrl]);

	// const runtime = useQuery({
	// 	queryKey: ["runtime", apiBaseUrl],
	// 	queryFn: async () => {
	// 		const response = await api.rpc.base.get("/runtime");
	// 		const data = await response.data;
	// 		if (!data) throw new Error("Failed to fetch runtime");
	// 		return data;
	// 	},
	// 	staleTime: 5 * MINUTE,

	// 	enabled: !!api,
	// });

	const flag = useRef(false);

	useEffect(() => {
		if (
			!flag.current &&
			wallet
			//    && runtime.data
		) {
			flag.current = true;
			// const fsContracts = getContracts({
			// 	client: wallet,
			// 	chainId: runtime.data.chain.id,
			// });
			// setContracts(fsContracts);
		}
	}, [
		// runtime.data,
		wallet,
	]);

	const value: PanthaContext = useMemo(
		() => ({
			ready: !!api, //&& !!runtime.data,
			wallet: wallet,
			api: api,
			// runtime: runtime.data || ({} as Runtime),
		}),
		[
			api,
			wallet, //runtime.data
		],
	);

	// if (!runtime.data) return <>Runtime Loading...</>;
	// if (!contracts) return <>conaracts not ready</>;

	return (
		<PanthaContext.Provider value={value}>{children}</PanthaContext.Provider>
	);
}

export function usePanthaContext() {
	return useContext(PanthaContext);
}

// type Runtime = {
// 	uptime: number;
// 	chain: Chain;
// 	serverAddressSynapse: string;
// };

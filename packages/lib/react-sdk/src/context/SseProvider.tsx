import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from "react";
import { usePanthaContext } from "./PanthaProvider";

type EventHandler = (data: unknown) => void;

type SseContextType = {
	subscribe: (type: string, handler: EventHandler) => () => void;
};

const SseContext = createContext<SseContextType | null>(null);

function parseSseEvent(raw: string) {
	let id: string | undefined;
	let event = "message";
	let data: string | undefined;

	for (const line of raw.split("\n")) {
		if (line.startsWith("id:")) id = line.slice(3).trim();
		else if (line.startsWith("event:")) event = line.slice(6).trim();
		else if (line.startsWith("data:")) {
			const val = line.slice(5).trim();
			data = data ? `${data}\n${val}` : val;
		}
	}

	if (!data && !event) return null;
	return { id, event, data };
}

export function SseProvider({ children }: { children: ReactNode }) {
	const { api } = usePanthaContext();
	const handlers = useRef<Map<string, Set<EventHandler>>>(new Map());

	useEffect(() => {
		if (!api.jwtExists) return;

		let alive = true;
		let lastEventId = "";
		const ctrl = new AbortController();

		async function connect() {
			while (alive) {
				try {
					const url = api.rpc.sse.events.$url();
					const headers: Record<string, string> = {
						Accept: "text/event-stream",
						...api.authHeaders,
					};
					if (lastEventId) {
						headers["Last-Event-ID"] = lastEventId;
					}

					const res = await fetch(url, {
						headers,
						signal: ctrl.signal,
					});

					if (!res.ok || !res.body) {
						throw new Error(`SSE connection failed: ${res.status}`);
					}

					const reader = res.body.getReader();
					const decoder = new TextDecoder();
					let buffer = "";

					while (alive) {
						const { done, value } = await reader.read();
						if (done) break;

						buffer += decoder.decode(value, { stream: true });
						const parts = buffer.split("\n\n");
						buffer = parts.pop() ?? "";

						for (const part of parts) {
							const evt = parseSseEvent(part);
							if (!evt || evt.event === "ping") continue;
							if (evt.id) lastEventId = evt.id;

							const set = handlers.current.get(evt.event);
							if (set) {
								const parsed = evt.data ? JSON.parse(evt.data) : null;
								for (const h of set) h(parsed);
							}
						}
					}
				} catch {
					if (!alive) return;
					console.warn("SSE disconnected, reconnecting...");
					await new Promise((r) => setTimeout(r, 3000));
				}
			}
		}

		connect();

		return () => {
			alive = false;
			ctrl.abort();
		};
	}, [api]);

	const subscribe = useCallback((type: string, handler: EventHandler) => {
		let set = handlers.current.get(type);
		if (!set) {
			set = new Set();
			handlers.current.set(type, set);
		}
		set.add(handler);

		return () => {
			handlers.current.get(type)?.delete(handler);
		};
	}, []);

	return (
		<SseContext.Provider value={{ subscribe }}>{children}</SseContext.Provider>
	);
}

export function useEvent(type: string, handler: EventHandler) {
	const ctx = useContext(SseContext);

	if (!ctx) {
		throw new Error("useEvent must be used inside SseProvider");
	}

	useEffect(() => {
		return ctx.subscribe(type, handler);
	}, [ctx, type, handler]);
}

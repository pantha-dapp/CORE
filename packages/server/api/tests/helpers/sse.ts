import { sse } from "../../../lib/utils/sse";

type SseEvent = { type: string; payload: unknown };

export function waitForSseEvent(opts: {
	userWallet: string;
	type: string;
	timeoutMs?: number;
}): Promise<SseEvent> {
	return new Promise<SseEvent>((resolve, reject) => {
		const deadline = setTimeout(() => {
			unsubscribe();
			reject(
				new Error(
					`Timed out waiting for SSE event "${opts.type}" for ${opts.userWallet}`,
				),
			);
		}, opts.timeoutMs ?? 5000);

		const unsubscribe = sse.subscribe(opts.userWallet, (event) => {
			if (event.type === opts.type) {
				clearTimeout(deadline);
				unsubscribe();
				resolve(event);
			}
		});
	});
}

/**
 * Subscribes for `windowMs` and resolves only if no matching event arrives.
 * Rejects immediately if an unexpected event is received.
 * Subscribe BEFORE triggering the action under test.
 */
export function expectNoSseEvent(opts: {
	userWallet: string;
	type: string;
	windowMs?: number;
}): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const unsubscribe = sse.subscribe(opts.userWallet, (event) => {
			if (event.type === opts.type) {
				unsubscribe();
				clearTimeout(timer);
				reject(
					new Error(
						`Unexpected SSE event "${opts.type}" received for ${opts.userWallet}`,
					),
				);
			}
		});

		const timer = setTimeout(() => {
			unsubscribe();
			resolve();
		}, opts.windowMs ?? 500);
	});
}

// Keep legacy names as aliases so existing imports still compile while tests
// are progressively migrated.
/** @deprecated Use waitForSseEvent instead */
export const expectSseEvent = (
	_redis: unknown,
	opts: { userWallet: string; type: string; timeoutMs?: number },
) => waitForSseEvent(opts);

/** @deprecated No-op — in-memory pub/sub has no stream to drain. */
export async function drainSseStream(
	_redis: unknown,
	_userWallet: string,
): Promise<string> {
	return "";
}

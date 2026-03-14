import { useCallback, useEffect, useMemo } from "react";
import { defaultPatterns } from "web-haptics";
import { useWebHaptics } from "web-haptics/react";

/** Raw vibration durations (ms) for direct navigator.vibrate fallback
 *  Pattern format: [vibrate, pause, vibrate, pause, ...]
 *  TAP     — single light pulse for navigation
 *  SUCCESS — quick ascending triple-tap (da-da-DA)
 *  ERROR   — heavy aggressive triple-buzz (BUZZ-BUZZ-BUZZZ)
 *  WARNING — two medium pulses
 */
const VIBRATE_TAP = [50];
const VIBRATE_SUCCESS = [20, 50, 30, 50, 50];
const VIBRATE_ERROR = [100, 30, 100, 30, 150];
const VIBRATE_WARNING = [60, 80, 60];

function vibrate(pattern: number[]) {
	try {
		navigator?.vibrate?.(pattern);
	} catch {
		// silently ignore — not supported
	}
}

export function useHapticFeedback() {
	const { trigger, isSupported } = useWebHaptics();

	useEffect(() => {
		console.log(
			"[haptics] Vibration API supported:",
			typeof navigator !== "undefined" &&
				typeof navigator.vibrate === "function",
		);
		console.log("[haptics] WebHaptics isSupported:", isSupported);
	}, [isSupported]);

	const tap = useCallback(() => {
		vibrate(VIBRATE_TAP);
		trigger();
	}, [trigger]);

	const success = useCallback(() => {
		vibrate(VIBRATE_SUCCESS);
		trigger(defaultPatterns.success);
	}, [trigger]);

	const error = useCallback(() => {
		vibrate(VIBRATE_ERROR);
		trigger(defaultPatterns.error);
	}, [trigger]);

	const warning = useCallback(() => {
		vibrate(VIBRATE_WARNING);
		trigger(defaultPatterns.warning);
	}, [trigger]);

	return useMemo(
		() => ({ tap, success, error, warning }),
		[tap, success, error, warning],
	);
}

import { useEffect, useRef, useState } from "react";

const LERP_FACTOR = 0.12;

/**
 * Smooths scroll progress so text decelerates gently when scrolling stops.
 * Returns a value (0-1) that lerps towards the target each frame.
 */
export function useSmoothScrollProgress(target: number): number {
	const currentRef = useRef(target);
	const [display, setDisplay] = useState(target);

	useEffect(() => {
		let raf: number;
		const update = () => {
			const diff = target - currentRef.current;
			currentRef.current += diff * LERP_FACTOR;
			if (Math.abs(diff) > 0.0005) {
				setDisplay(currentRef.current);
				raf = requestAnimationFrame(update);
			}
		};
		raf = requestAnimationFrame(update);
		return () => cancelAnimationFrame(raf);
	}, [target]);

	return display;
}

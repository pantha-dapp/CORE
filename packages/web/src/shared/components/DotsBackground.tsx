import type React from "react";

const DOT_SIZE = 2;
const DOT_GAP = 36;

const DOTS_BACKGROUND_IMAGE = [
	`radial-gradient(circle at 4px 4px, var(--dots-color) ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
	`radial-gradient(circle at 12px 4px, var(--dots-color) ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
	`radial-gradient(circle at 20px 4px, var(--dots-color) ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
	`radial-gradient(circle at 28px 4px, var(--dots-color) ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
	`radial-gradient(circle at 8px 12px, var(--dots-color) ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
	`radial-gradient(circle at 16px 12px, var(--dots-color) ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
	`radial-gradient(circle at 24px 12px, var(--dots-color) ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
	`radial-gradient(circle at 32px 12px, var(--dots-color) ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
].join(", ");

export interface DotsBackgroundProps {
	className?: string;
	/** Default: true - prevents interaction with elements behind */
	pointerEvents?: "none" | "auto";
}

export function DotsBackground({
	className = "",
	pointerEvents = "none",
}: DotsBackgroundProps) {
	return (
		<div
			className={`animate-dots-scroll ${className}`}
			style={
				{
					backgroundImage: DOTS_BACKGROUND_IMAGE,
					backgroundSize: "36px 16px",
					"--dot-gap": `${DOT_GAP}px`,
					pointerEvents,
				} as React.CSSProperties
			}
			aria-hidden
		/>
	);
}

import { useMemo } from "react";

// Per-word rotation direction: mix of 1 and -1 for variety
const WORD_ROTATIONS = [1, -1, -1, 1, -1, 1, 1, -1, 1, -1];
const MAX_ROTATION = 12;

interface FlowTextProps {
	text: string;
	textColor: string;
	/** 0 = at center (straight), 1 = far from center (max rotation) */
	distanceFromCenter: number;
}

export function FlowText({
	text,
	textColor,
	distanceFromCenter,
}: FlowTextProps) {
	const wordItems = useMemo(
		() =>
			text.split(/\s+/).map((word, i) => ({
				id: `${word}-${i}`,
				word,
				direction: WORD_ROTATIONS[i % WORD_ROTATIONS.length],
			})),
		[text],
	);

	return (
		<p
			className="text-center max-w-4xl font-bold leading-tight"
			style={{
				color: textColor,
				fontSize: "clamp(2.5rem, 6vw, 5rem)",
			}}
		>
			{wordItems.map((item, i) => (
				<span
					key={item.id}
					className="inline-block align-baseline"
					style={{
						transform: `rotate(${distanceFromCenter * MAX_ROTATION * item.direction}deg)`,
					}}
				>
					{item.word}
					{i < wordItems.length - 1 ? "\u00A0" : ""}
				</span>
			))}
		</p>
	);
}

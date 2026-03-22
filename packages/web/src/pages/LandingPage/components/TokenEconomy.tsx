import { useEffect, useRef, useState } from "react";
import { DotsBackground } from "../../../shared/components/DotsBackground";

const CARDS = [
	{
		bg: "#61609a",
		text: "#f8c1ba",
		content: "Learn, earn, and get rewarded.",
		rotation: 2,
	},
	{
		bg: "#c94245",
		text: "#f9cc73",
		content: "$PXP Earn by learning, helping, and engaging.",
		rotation: -5,
	},
	{
		bg: "#f9cc73",
		text: "#ac4f98",
		content: "$PANTHA Tradable rewards from platform revenue.",
		rotation: 4,
	},
] as const;

const OVERLAP = 450;

const PREV_COLOR = { r: 0xac, g: 0x4f, b: 0x98 }; // HowItWorks end purple
const TARGET_COLOR = { r: 0xf8, g: 0xc1, b: 0xba };
const REACH_TARGET_AT = 0.15; // Change as soon as cards come into view

function sectionScrollProgress(rect: DOMRect, scrollRange: number): number {
	const scrolled = Math.max(0, -rect.top);
	return Math.min(1, scrolled / scrollRange);
}

export function TokenEconomy() {
	const blockRef = useRef<HTMLDivElement>(null);
	const sectionRef = useRef<HTMLDivElement>(null);
	const [inBlock, setInBlock] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const wh = window.innerHeight;
			if (!blockRef.current || !sectionRef.current) return;
			const blockRect = blockRef.current.getBoundingClientRect();
			const sectionRect = sectionRef.current.getBoundingClientRect();
			setInBlock(blockRect.top < wh);
			const scrollRange = Math.max(1, 1400 - wh);
			const rawProgress = sectionScrollProgress(sectionRect, scrollRange);
			// Complete transition in first 15% of scroll - as soon as cards come
			setProgress(Math.min(1, rawProgress / REACH_TARGET_AT));
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const r = Math.round(
		PREV_COLOR.r + (TARGET_COLOR.r - PREV_COLOR.r) * progress,
	);
	const g = Math.round(
		PREV_COLOR.g + (TARGET_COLOR.g - PREV_COLOR.g) * progress,
	);
	const b = Math.round(
		PREV_COLOR.b + (TARGET_COLOR.b - PREV_COLOR.b) * progress,
	);
	const bgColor = `rgb(${r}, ${g}, ${b})`;

	return (
		<div ref={blockRef} className="relative">
			<div
				className="fixed inset-0 z-0 pointer-events-none"
				style={{
					backgroundColor: bgColor,
					visibility: inBlock ? "visible" : "hidden",
				}}
				aria-hidden
			/>
			<section
				ref={sectionRef}
				className="min-h-screen flex items-center justify-center px-6 md:px-12 py-20 relative z-10"
			>
				<div className="relative w-full max-w-3xl" style={{ minHeight: 1400 }}>
					{CARDS.map((card, i) => {
						const pairZIndex = i === 1 ? 0 : i === 0 ? 1 : 2;
						const extraOffset = i === 2 ? " translateX(-24px)" : "";
						const cardTransform = `rotate(${card.rotation}deg)${extraOffset}`;
						return (
							<div
								key={card.content}
								className="absolute left-0 right-0 flex justify-center"
								style={{ top: i * OVERLAP, zIndex: pairZIndex }}
							>
								{/* Back card with dots - larger, contains front card centered */}
								<div
									className="relative w-[calc(100%+48px)] min-h-[calc(50vh+48px)] border-4 border-black overflow-hidden"
									style={{
										backgroundColor: card.bg,
										transform: cardTransform,
									}}
								>
									<DotsBackground className="absolute inset-0" />
									{/* Front card - centered inside back card */}
									<div
										className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-48px)] min-h-[50vh] border-4 border-black flex items-center justify-center px-10 py-16 md:px-16 md:py-20"
										style={{ backgroundColor: card.bg }}
									>
										<p
											className="w-full text-center font-titillium font-bold text-4xl md:text-4xl lg:text-5xl leading-snug"
											style={{ color: card.text }}
										>
											{card.content}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}

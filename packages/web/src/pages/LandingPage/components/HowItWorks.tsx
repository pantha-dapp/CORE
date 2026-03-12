import { useEffect, useRef, useState } from "react";
import { HowItWorksStep1 } from "./HowItWorksStep1";
import { HowItWorksStep2 } from "./HowItWorksStep2";
import { HowItWorksStep3 } from "./HowItWorksStep3";
import { HowItWorksStep4 } from "./HowItWorksStep4";
import { useSmoothScrollProgress } from "./useSmoothScrollText";

// Step 1 timeline: rise → stay straight (x) → rotate & leave
const RISE_END = 0.2; // Text becomes straight at 20% scroll
const STRAIGHT_DURATION = 0.4; // Text stays straight for 40% of scroll (x)
const STRAIGHT_END = RISE_END + STRAIGHT_DURATION; // 0.6 - when rotate/leave starts
const CAT_APPEAR_AT = RISE_END + STRAIGHT_DURATION / 2; // Cat at x/2 into straight period

// Section colors: fully reached when that section's top hits viewport top
const STEP1_COLOR = { r: 0xc9, g: 0x42, b: 0x45 }; // #c94245
const STEP2_COLOR = { r: 0xf9, g: 0xcc, b: 0x73 }; // #f9cc73
const STEP3_COLOR = { r: 0xf8, g: 0xc1, b: 0xba }; // #f8c1ba
const STEP4_COLOR = { r: 0xac, g: 0x4f, b: 0x98 }; // #ac4f98
const INITIAL_COLOR = { r: 0x85, g: 0x84, b: 0xbd }; // from Hero

const DOT_SIZE = 2;

function sectionScrollProgress(
	rect: DOMRect,
	sectionHeightVh: number,
	wh: number,
): number {
	const sectionHeight = wh * (sectionHeightVh / 100);
	const scrollRange = Math.max(1, sectionHeight - wh);
	const scrolled = Math.max(0, -rect.top);
	return Math.min(1, scrolled / scrollRange);
}

function lerpColor(
	from: { r: number; g: number; b: number },
	to: { r: number; g: number; b: number },
	t: number,
): { r: number; g: number; b: number } {
	const u = Math.max(0, Math.min(1, t));
	return {
		r: Math.round(from.r + (to.r - from.r) * u),
		g: Math.round(from.g + (to.g - from.g) * u),
		b: Math.round(from.b + (to.b - from.b) * u),
	};
}

export function HowItWorks() {
	const blockRef = useRef<HTMLDivElement>(null);
	const step1Ref = useRef<HTMLDivElement>(null);
	const step2Ref = useRef<HTMLDivElement>(null);
	const step3Ref = useRef<HTMLDivElement>(null);
	const step4Ref = useRef<HTMLDivElement>(null);
	const [inBlock, setInBlock] = useState(false);
	const [step1Progress, setStep1Progress] = useState(0);
	const [step2Progress, setStep2Progress] = useState(0);
	const [step3Progress, setStep3Progress] = useState(0);
	const [step4Progress, setStep4Progress] = useState(0);
	const [step1Top, setStep1Top] = useState(0);
	const [step2Top, setStep2Top] = useState(0);
	const [step3Top, setStep3Top] = useState(0);
	const [step4Top, setStep4Top] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const wh = window.innerHeight;
			if (!blockRef.current) return;
			const blockRect = blockRef.current.getBoundingClientRect();
			setInBlock(blockRect.top < wh);

			if (step1Ref.current) {
				const r1 = step1Ref.current.getBoundingClientRect();
				setStep1Progress(sectionScrollProgress(r1, 130, wh));
				setStep1Top(r1.top);
			}
			if (step2Ref.current) {
				const r2 = step2Ref.current.getBoundingClientRect();
				setStep2Progress(sectionScrollProgress(r2, 130, wh));
				setStep2Top(r2.top);
			}
			if (step3Ref.current) {
				const r3 = step3Ref.current.getBoundingClientRect();
				setStep3Progress(sectionScrollProgress(r3, 130, wh));
				setStep3Top(r3.top);
			}
			if (step4Ref.current) {
				const r4 = step4Ref.current.getBoundingClientRect();
				setStep4Progress(sectionScrollProgress(r4, 130, wh));
				setStep4Top(r4.top);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Gradual color: fully reached when section top hits viewport top
	const wh = typeof window !== "undefined" ? window.innerHeight : 1080;
	let rgb: { r: number; g: number; b: number };
	if (step1Top === 0 && step2Top === 0 && step3Top === 0 && step4Top === 0) {
		rgb = INITIAL_COLOR; // Unmeasured (first paint)
	} else if (step1Top > 0) {
		// Approaching step 1: transition from initial to #c94245
		const t = 1 - step1Top / wh;
		rgb = lerpColor(INITIAL_COLOR, STEP1_COLOR, Math.max(0, t));
	} else if (step2Top > 0) {
		// Between step 1 and 2: transition to step 2 color
		const t = 1 - step2Top / wh;
		rgb = lerpColor(STEP1_COLOR, STEP2_COLOR, Math.max(0, t));
	} else if (step3Top > 0) {
		// Between step 2 and 3
		const t = 1 - step3Top / wh;
		rgb = lerpColor(STEP2_COLOR, STEP3_COLOR, Math.max(0, t));
	} else if (step4Top > 0) {
		// Between step 3 and 4
		const t = 1 - step4Top / wh;
		rgb = lerpColor(STEP3_COLOR, STEP4_COLOR, Math.max(0, t));
	} else {
		rgb = STEP4_COLOR;
	}
	const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

	// Step 1 scroll-based animation: rise → stay straight → rotate & leave
	const step1Smoothed = useSmoothScrollProgress(step1Progress);
	const step1RiseProgress = Math.min(
		1,
		RISE_END > 0 ? step1Smoothed / RISE_END : 1,
	);
	const step1TextAtCenter = step1RiseProgress >= 1;
	const step1CanScrollPast = step1Smoothed >= STRAIGHT_END;
	const step1ScrollPastProgress = step1CanScrollPast
		? Math.min(1, (step1Smoothed - STRAIGHT_END) / (1 - STRAIGHT_END))
		: 0;
	const step1TextTranslateY = !step1TextAtCenter
		? (1 - step1RiseProgress) * 20
		: !step1CanScrollPast
			? 0
			: -step1ScrollPastProgress * 55;
	const step1ImageVisible = step1TextAtCenter && step1Progress < 1;
	const step1ImageOpacity =
		step1Smoothed >= CAT_APPEAR_AT
			? Math.min(1, (step1Smoothed - CAT_APPEAR_AT) / 0.15)
			: 0;
	const step1DistanceFromCenter = !step1TextAtCenter
		? 1 - step1RiseProgress
		: !step1CanScrollPast
			? 0
			: step1ScrollPastProgress;

	// Steps 2, 3, 4: same timeline logic as step 1
	const step2Smoothed = useSmoothScrollProgress(step2Progress);
	const step3Smoothed = useSmoothScrollProgress(step3Progress);
	const step4Smoothed = useSmoothScrollProgress(step4Progress);

	const step2RiseProgress = Math.min(
		1,
		RISE_END > 0 ? step2Smoothed / RISE_END : 1,
	);
	const step2TextAtCenter = step2RiseProgress >= 1;
	const step2CanScrollPast = step2Smoothed >= STRAIGHT_END;
	const step2ScrollPastProgress = step2CanScrollPast
		? Math.min(1, (step2Smoothed - STRAIGHT_END) / (1 - STRAIGHT_END))
		: 0;
	const step2TextTranslateY = !step2TextAtCenter
		? (1 - step2RiseProgress) * 20
		: !step2CanScrollPast
			? 0
			: -step2ScrollPastProgress * 55;
	const step2DistanceFromCenter = !step2TextAtCenter
		? 1 - step2RiseProgress
		: !step2CanScrollPast
			? 0
			: step2ScrollPastProgress;
	const step2ImageVisible = step2TextAtCenter && step2Progress < 1;
	const step2ImageOpacity =
		step2Smoothed >= CAT_APPEAR_AT
			? Math.min(1, (step2Smoothed - CAT_APPEAR_AT) / 0.15)
			: 0;

	const step3RiseProgress = Math.min(
		1,
		RISE_END > 0 ? step3Smoothed / RISE_END : 1,
	);
	const step3TextAtCenter = step3RiseProgress >= 1;
	const step3CanScrollPast = step3Smoothed >= STRAIGHT_END;
	const step3ScrollPastProgress = step3CanScrollPast
		? Math.min(1, (step3Smoothed - STRAIGHT_END) / (1 - STRAIGHT_END))
		: 0;
	const step3TextTranslateY = !step3TextAtCenter
		? (1 - step3RiseProgress) * 20
		: !step3CanScrollPast
			? 0
			: -step3ScrollPastProgress * 55;
	const step3DistanceFromCenter = !step3TextAtCenter
		? 1 - step3RiseProgress
		: !step3CanScrollPast
			? 0
			: step3ScrollPastProgress;
	const step3ImageVisible = step3TextAtCenter && step3Progress < 1;
	const step3ImageOpacity =
		step3Smoothed >= CAT_APPEAR_AT
			? Math.min(1, (step3Smoothed - CAT_APPEAR_AT) / 0.15)
			: 0;

	const step4RiseProgress = Math.min(
		1,
		RISE_END > 0 ? step4Smoothed / RISE_END : 1,
	);
	const step4TextAtCenter = step4RiseProgress >= 1;
	const step4CanScrollPast = step4Smoothed >= STRAIGHT_END;
	const step4ScrollPastProgress = step4CanScrollPast
		? Math.min(1, (step4Smoothed - STRAIGHT_END) / (1 - STRAIGHT_END))
		: 0;
	const step4TextTranslateY = !step4TextAtCenter
		? (1 - step4RiseProgress) * 20
		: !step4CanScrollPast
			? 0
			: -step4ScrollPastProgress * 55;
	const step4DistanceFromCenter = !step4TextAtCenter
		? 1 - step4RiseProgress
		: !step4CanScrollPast
			? 0
			: step4ScrollPastProgress;
	const step4ImageVisible = step4TextAtCenter && step4Progress < 1;
	const step4ImageOpacity =
		step4Smoothed >= CAT_APPEAR_AT
			? Math.min(1, (step4Smoothed - CAT_APPEAR_AT) / 0.15)
			: 0;

	return (
		<div ref={blockRef} className="relative">
			{/* Single continuous background - only visible when block is in viewport */}
			<div
				className="fixed inset-0 z-0 pointer-events-none"
				style={{
					backgroundColor: bgColor,
					visibility: inBlock ? "visible" : "hidden",
				}}
				aria-hidden
			/>
			{/* Step images - driven by section scroll, same pattern as step 1 */}
			{step1ImageVisible && (
				<div
					className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
					aria-hidden
				>
					<div
						className="w-full px-6"
						style={{
							opacity: step1ImageOpacity,
							transition: "opacity 0.1s ease-out",
						}}
					>
						<img
							src="/images/pantha/step1.gif"
							alt="Pantha thinking about what to learn"
							className="w-full object-contain object-center"
						/>
					</div>
				</div>
			)}
			{step2ImageVisible && (
				<div
					className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
					aria-hidden
				>
					<div
						className="w-full px-6"
						style={{
							opacity: step2ImageOpacity,
							transition: "opacity 0.1s ease-out",
						}}
					>
						<img
							src="/images/pantha/step2.webp"
							alt="Pantha refining your goals with follow-up questions"
							className="w-full object-contain object-center"
						/>
					</div>
				</div>
			)}
			{step3ImageVisible && (
				<div
					className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
					aria-hidden
				>
					<div
						className="w-full px-6"
						style={{
							opacity: step3ImageOpacity,
							transition: "opacity 0.1s ease-out",
						}}
					>
						<img
							src="/images/pantha/step3.png"
							alt="Pantha presenting your course — 50+ chapters"
							className="w-full object-contain object-center"
						/>
					</div>
				</div>
			)}
			{step4ImageVisible && (
				<div
					className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
					aria-hidden
				>
					<div
						className="w-full px-6"
						style={{
							opacity: step4ImageOpacity,
							transition: "opacity 0.1s ease-out",
						}}
					>
						<img
							src="/images/pantha/step4.png"
							alt="Pantha with quizzes, streaks, and rewards"
							className="w-full object-contain object-center"
						/>
					</div>
				</div>
			)}
			<section className="px-6 md:px-12 py-20 relative z-10">
				<div className="relative w-full max-w-3xl mx-auto">
					{/* Back card with dots - black border at top and bottom */}
					<div
						className="relative w-[calc(100%+48px)] -mx-6 overflow-hidden border-t-4 border-b-4 border-black"
						style={{ backgroundColor: bgColor }}
					>
						<div
							className="absolute inset-0 animate-dots-scroll pointer-events-none"
							style={
								{
									backgroundImage: `radial-gradient(circle at 4px 4px, black ${DOT_SIZE}px, transparent ${DOT_SIZE}px), radial-gradient(circle at 12px 4px, black ${DOT_SIZE}px, transparent ${DOT_SIZE}px), radial-gradient(circle at 20px 4px, black ${DOT_SIZE}px, transparent ${DOT_SIZE}px), radial-gradient(circle at 28px 4px, black ${DOT_SIZE}px, transparent ${DOT_SIZE}px), radial-gradient(circle at 8px 12px, black ${DOT_SIZE}px, transparent ${DOT_SIZE}px), radial-gradient(circle at 16px 12px, black ${DOT_SIZE}px, transparent ${DOT_SIZE}px), radial-gradient(circle at 24px 12px, black ${DOT_SIZE}px, transparent ${DOT_SIZE}px), radial-gradient(circle at 32px 12px, black ${DOT_SIZE}px, transparent ${DOT_SIZE}px)`,
									backgroundSize: "36px 16px",
								} as React.CSSProperties
							}
						/>
						{/* Front card - black border on all sides including top and bottom */}
						<div
							className="relative z-10 mx-4 my-4 border-4 border-black min-h-0"
							style={{ backgroundColor: bgColor }}
						>
							<HowItWorksStep1
								ref={step1Ref}
								textTranslateY={step1TextTranslateY}
								distanceFromCenter={step1DistanceFromCenter}
							/>
							<HowItWorksStep2
								ref={step2Ref}
								textTranslateY={step2TextTranslateY}
								distanceFromCenter={step2DistanceFromCenter}
							/>
							<HowItWorksStep3
								ref={step3Ref}
								textTranslateY={step3TextTranslateY}
								distanceFromCenter={step3DistanceFromCenter}
							/>
							<HowItWorksStep4
								ref={step4Ref}
								textTranslateY={step4TextTranslateY}
								distanceFromCenter={step4DistanceFromCenter}
							/>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

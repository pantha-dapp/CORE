import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// LET ME on same line, then DESIGN YOUR LEARNING PATH - each on own line
const WORDS = ["LET ME", "DESIGN", "YOUR", "LEARNING", "PATH"];
const WORD_ROTATIONS = [10, -8, 15, -10, -12];

export function Hero() {
	const navigate = useNavigate();
	const [textLoaded, setTextLoaded] = useState(false);
	const [wordsCanStart, setWordsCanStart] = useState(false);

	// Start words after I'M PANTHA is thrown off (1.1s = throw duration + buffer)
	useEffect(() => {
		if (!textLoaded) return;
		const t = setTimeout(() => setWordsCanStart(true), 200);
		return () => clearTimeout(t);
	}, [textLoaded]);

	return (
		<div
			className="relative h-screen overflow-hidden flex flex-col font-titillium transition-colors duration-[2s] ease-out"
			style={{
				backgroundColor: wordsCanStart
					? "var(--color-landing-hero-bg)"
					: "var(--landing-1-bg)",
				color: "var(--landing-1-text)",
			}}
		>
			{/* Navbar */}
			<header className="shrink-0 z-10 mx-4 mt-4 md:mx-8 md:mt-6">
				<nav className="flex justify-between items-center bg-white border-4 border-black px-3 py-1">
					<span className="font-titillium font-bold text-xl tracking-tight text-black">
						PANTHA
					</span>
					<button
						type="button"
						onClick={() => navigate({ to: "/login" })}
						className="font-haymer text-black text-base hover:opacity-80 transition-opacity"
					>
						LOGIN
					</button>
				</nav>
			</header>

			{/* I'M PANTHA: two lines, slide up from below, then thrown off - I'M right, PANTHA left */}
			<div
				className={`absolute inset-0 overflow-hidden pointer-events-none ${
					textLoaded ? "z-0" : "z-20"
				}`}
				onAnimationEnd={(e) => {
					const el = e.target as HTMLElement;
					if (el.classList.contains("animate-slide-up-angle-positive")) {
						setTextLoaded(true);
					}
				}}
			>
				<div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
					<div
						className={`transition-transform duration-1000 ease-out ${
							textLoaded ? "translate-x-[150vw]" : "translate-x-0"
						}`}
					>
						<div className="overflow-hidden">
							<h1
								className="text-7xl md:text-9xl font-bold tracking-tight animate-slide-up-angle-positive"
								style={{ animationDelay: "200ms" }}
							>
								I'M
							</h1>
						</div>
					</div>
					<div
						className={`transition-transform duration-1000 ease-out ${
							textLoaded ? "-translate-x-[150vw]" : "translate-x-0"
						}`}
					>
						<div className="overflow-hidden">
							<h1
								className="text-7xl md:text-9xl font-bold tracking-tight animate-slide-up-angle-negative"
								style={{ animationDelay: "0ms" }}
							>
								PANTHA
							</h1>
						</div>
					</div>
				</div>
			</div>

			{/* Words top left, Pantha image bottom right */}
			<div className="flex-1 relative min-h-0 z-10">
				{/* Words: top left */}
				<div className="absolute top-0 left-4 right-0 bottom-0 overflow-hidden md:px-10">
					{WORDS.map((word, i) => (
						<div
							key={word}
							className="absolute left-0 flex items-start justify-start"
							style={{
								top: `${5 + (i / 5) * 45}%`,
								bottom: 0,
							}}
						>
							<h2
								className={`text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-tight ${
									wordsCanStart ? "animate-slide-up-line" : ""
								}`}
								data-angle={i}
								style={{
									...(wordsCanStart && {
										animationDelay: `${200 + i * 200}ms`,
									}),
									...(!wordsCanStart && {
										transform: `translateY(100vh) rotate(${WORD_ROTATIONS[i]}deg)`,
									}),
								}}
							>
								{word}
							</h2>
						</div>
					))}
				</div>
				{/* Pantha image: hidden at start, slides in from left when words appear */}
				<div className="absolute bottom-0 right-0 md:bottom-8 md:right-8 overflow-visible">
					<img
						src="/gifs/pantha_waving_fast.webp"
						alt="Pantha waving"
						className={`w-full transition-all duration-1000 ease-out origin-bottom-right ${
							wordsCanStart
								? "translate-x-[5vw] translate-y-[2vh] opacity-100"
								: "translate-x-[120vw] translate-y-0 scale-100 opacity-0"
						}`}
						style={{
							transformOrigin: "bottom right",
						}}
					/>
				</div>
			</div>
		</div>
	);
}

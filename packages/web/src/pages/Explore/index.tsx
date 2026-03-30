import { usePanthaContext } from "@pantha/react";
import {
	useCourseById,
	useCourseExploration,
	useEnrollForCourse,
	useUserCourses,
} from "@pantha/react/hooks";
import { useEffect, useRef, useState } from "react";
import PageHeader from "../../shared/components/PageHeader";

interface CourseDetails {
	[key: string]: string;
}

export default function Explore() {
	const { wallet } = usePanthaContext();
	const walletAddress = wallet?.account.address;

	const userCoursesQuery = useUserCourses({
		walletAddress,
	});

	const courseExplorationQuery = useCourseExploration({
		id: "explore",
	});

	const enrollForCourseMutation = useEnrollForCourse();
	const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

	const selectedCourseQuery = useCourseById({
		id: selectedCourseId || undefined,
	});

	/* 🌌 PARTICLE SYSTEM */
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const particles: {
			x: number;
			y: number;
			vx: number;
			vy: number;
			radius: number;
		}[] = [];
		const numParticles = 40;

		const resize = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		};

		resize();
		window.addEventListener("resize", resize);

		for (let i = 0; i < numParticles; i++) {
			particles.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: (Math.random() - 0.5) * 0.5,
				radius: Math.random() * 2 + 1,
			});
		}

		const draw = () => {
			if (!ctx) return;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			particles.forEach((p) => {
				p.x += p.vx;
				p.y += p.vy;

				if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
				if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
				ctx.fillStyle = "rgba(150,150,150,0.4)";
				ctx.fill();
			});

			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const dx = particles[i].x - particles[j].x;
					const dy = particles[i].y - particles[j].y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < 100) {
						ctx.beginPath();
						ctx.moveTo(particles[i].x, particles[i].y);
						ctx.lineTo(particles[j].x, particles[j].y);
						ctx.strokeStyle = "rgba(150,150,150,0.1)";
						ctx.stroke();
					}
				}
			}

			requestAnimationFrame(draw);
		};

		draw();

		return () => {
			window.removeEventListener("resize", resize);
		};
	}, []);

	useEffect(() => {
		const detailsMap: CourseDetails = {};

		if (courseExplorationQuery.data?.suggestions) {
			courseExplorationQuery.data.suggestions.forEach((c) => {
				detailsMap[c.id] = c.title || "Untitled";
			});
		}

		if (
			userCoursesQuery.data?.courses &&
			userCoursesQuery.data.courses.length > 0
		) {
			const fetchEnrolledTitles = async () => {
				const updatedMap = { ...detailsMap };

				for (const course of userCoursesQuery.data.courses || []) {
					try {
						const res = await fetch(`/api/courses/${course.courseId}`);
						if (res.ok) {
							const data = (await res.json()) as { data: { title: string } };
							updatedMap[course.courseId] = data.data.title;
						}
					} catch (error) {
						console.error(`Failed to fetch course ${course.courseId}:`, error);
					}
				}
			};

			fetchEnrolledTitles();
		}
	}, [
		userCoursesQuery.data?.courses,
		courseExplorationQuery.data?.suggestions,
	]);

	const enrolledCourseIds = new Set(
		userCoursesQuery.data?.courses?.map((c) => c.courseId) ?? [],
	);

	const handleEnroll = async (courseId: string) => {
		try {
			await enrollForCourseMutation.mutateAsync({ courseId });
			await userCoursesQuery.refetch();
		} catch (e) {
			console.error("Failed to enroll:", e);
		}
	};

	return (
		<div className="dark pt-6 min-h-screen bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg text-dark-text px-4 pb-24">
			<div className="max-w-6xl mx-auto">
				<PageHeader
					badge="Discovery"
					title="Explore"
					subtitle="Discover new courses, events, and shop items here!"
				/>

				{!walletAddress ? (
					<div className="text-center py-16">
						<p className="text-dark-muted text-lg font-montserrat">
							Connect your wallet to explore courses
						</p>
					</div>
				) : (
					<div className="space-y-10">
						{/* 🔥 HORIZONTAL COURSES */}
						{courseExplorationQuery.data?.suggestions && (
							<div className="space-y-4">
								<h2 className="text-2xl font-bold font-titillium">
									Recommended Courses
								</h2>

								<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
									{courseExplorationQuery.data.suggestions.map((course) => (
										<button
											type="button"
											key={course.id}
											className="min-w-[280px] max-w-[300px] flex-shrink-0 rounded-2xl bg-dark-surface border border-dark-border/50 p-5 hover:border-dark-accent transition-all duration-300 hover:scale-[1.02]"
											onClick={() => setSelectedCourseId(course.id)}
										>
											<h3 className="font-semibold mb-2 truncate text-lg">
												{course.title || "Untitled"}
											</h3>

											<p className="text-dark-muted text-sm line-clamp-3 mb-3">
												{course.description || "No description"}
											</p>

											{enrolledCourseIds.has(course.id) ? (
												<span className="w-full block rounded-lg bg-dark-border/50 px-3 py-2 text-sm font-semibold text-dark-muted text-center">
													Enrolled
												</span>
											) : (
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleEnroll(course.id);
													}}
													disabled={enrollForCourseMutation.isPending}
													className="w-full rounded-lg bg-dark-accent px-3 py-2 text-sm font-semibold text-dark-bg disabled:opacity-50"
												>
													{enrollForCourseMutation.isPending
														? "Enrolling..."
														: "Enroll"}
												</button>
											)}
										</button>
									))}
								</div>
							</div>
						)}

						{/* 🌌 AI GRAPH + PARTICLES */}
						<div className="relative h-[350px] rounded-2xl bg-dark-surface border border-dark-border/50 overflow-hidden flex items-center justify-center">
							{/* 🌌 PARTICLES */}
							<canvas
								ref={canvasRef}
								className="absolute inset-0 w-full h-full"
							/>

							{/* CENTER NODE */}
							<div className="absolute z-10 w-32 h-16 rounded-xl bg-dark-accent text-dark-bg flex items-center justify-center text-sm font-semibold animate-pulse shadow-lg">
								Explore
							</div>

							{/* RADIAL NODES */}
							<div className="absolute inset-0 flex items-center justify-center z-10">
								{/* TOP */}
								<div className="absolute -translate-y-[130px] w-28 h-14 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center text-xs animate-float">
									Web Dev
								</div>

								{/* RIGHT */}
								<div className="absolute translate-x-[180px] w-28 h-14 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center text-xs animate-float delay-200">
									AI/ML
								</div>

								{/* BOTTOM */}
								<div className="absolute translate-y-[130px] w-28 h-14 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center text-xs animate-float delay-300">
									Data
								</div>

								{/* LEFT */}
								<div className="absolute -translate-x-[180px] w-28 h-14 rounded-lg bg-dark-surface border border-dark-border flex items-center justify-center text-xs animate-float delay-500">
									Blockchain
								</div>
							</div>

							{/* 🔗 CLEAN CENTER CONNECTION LINES */}
							<svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
								<title>Connection lines</title>
								{/* TOP */}
								<line
									className="animate-line"
									x1="50%"
									y1="50%"
									x2="50%"
									y2="15%"
									stroke="gray"
									strokeWidth="1"
								/>

								{/* RIGHT */}
								<line
									className="animate-line delay-200"
									x1="50%"
									y1="50%"
									x2="85%"
									y2="50%"
									stroke="gray"
									strokeWidth="1"
								/>

								{/* BOTTOM */}
								<line
									className="animate-line delay-300"
									x1="50%"
									y1="50%"
									x2="50%"
									y2="85%"
									stroke="gray"
									strokeWidth="1"
								/>

								{/* LEFT */}
								<line
									className="animate-line delay-500"
									x1="50%"
									y1="50%"
									x2="15%"
									y2="50%"
									stroke="gray"
									strokeWidth="1"
								/>
							</svg>
						</div>

						{/* MODAL */}
						{selectedCourseId && selectedCourseQuery.data && (
							<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
								<div className="bg-dark-surface rounded-xl p-6 max-w-2xl w-full mx-4">
									<h2 className="text-2xl font-bold mb-4">
										{selectedCourseQuery.data.title}
									</h2>
									<p className="text-dark-muted">
										{selectedCourseQuery.data.description}
									</p>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

import {
	useCourseById,
	useCourseChaptersByCourseId,
	useEnrolledCourses,
} from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Button from "../../shared/components/Button";

// Component to display course icon with title
function CourseIcon({
	courseId,
	isActive,
	onClick,
}: {
	courseId: string;
	isActive: boolean;
	onClick: () => void;
}) {
	const courseDetails = useCourseById({ id: courseId });

	if (courseDetails.isLoading) {
		return (
			<div className="flex flex-col items-center gap-2 min-w-20">
				<div className="w-14 h-14 rounded-xl bg-gray-700 animate-pulse" />
				<div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
			</div>
		);
	}

	return (
		<button
			type="button"
			className="flex flex-col items-center gap-2 min-w-20 bg-transparent border-0 p-0 cursor-pointer"
			onClick={onClick}
		>
			<div
				className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
					isActive
						? "bg-green-500 scale-105 shadow-lg shadow-green-500/50"
						: "bg-gray-700 hover:bg-gray-600"
				}`}
			>
				<span className="text-white font-bold text-xl">
					{courseDetails.data?.title?.charAt(0).toUpperCase() || "C"}
				</span>
			</div>
			<p className="text-xs text-gray-300 text-center truncate w-full px-1">
				{courseDetails.data?.title || "Course"}
			</p>
		</button>
	);
}

export default function Dashboard() {
	const enrolledCourses = useEnrolledCourses();
	const router = useRouter();
	const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
	const [showCourseDrawer, setShowCourseDrawer] = useState(false);
	const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

	// Color themes that change every 15 chapters
	const colorThemes = [
		{ dot: "bg-green-500", card: "bg-gray-800" },
		{ dot: "bg-purple-500", card: "bg-purple-900" },
		{ dot: "bg-blue-500", card: "bg-blue-900" },
		{ dot: "bg-orange-500", card: "bg-orange-900" },
		{ dot: "bg-pink-500", card: "bg-pink-900" },
		{ dot: "bg-yellow-500", card: "bg-yellow-900" },
	];

	// Fetch selected course details
	const selectedCourseDetails = useCourseById({
		id: selectedCourseId || "",
	});

	// Fetch chapters for selected course
	const courseChapters = useCourseChaptersByCourseId({
		courseId: selectedCourseId || "",
	});

	// Set first course as selected by default
	useEffect(() => {
		if (
			enrolledCourses.data &&
			enrolledCourses.data.enrollments.length > 0 &&
			!selectedCourseId
		) {
			setSelectedCourseId(enrolledCourses.data.enrollments[0].courseId);
		}
	}, [enrolledCourses.data, selectedCourseId]);

	useEffect(() => {
		if (
			enrolledCourses.data !== undefined &&
			enrolledCourses.data.enrollments.length === 0
		) {
			router.navigate({ to: "/onboarding" });
		}
	}, [enrolledCourses.data, router]);

	// Track scroll position to update theme based on visible chapters
	useEffect(() => {
		if (!courseChapters.data?.chapters.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const chapterIndex = Number(
							entry.target.getAttribute("data-chapter-index"),
						);
						if (!Number.isNaN(chapterIndex)) {
							const themeIndex =
								Math.floor(chapterIndex / 15) % colorThemes.length;
							setCurrentThemeIndex(themeIndex);
						}
					}
				});
			},
			{
				threshold: 0.5,
				rootMargin: "-200px 0px -50% 0px",
			},
		);

		// Observe all chapter elements
		const chapterElements = document.querySelectorAll("[data-chapter-index]");
		for (const el of chapterElements) {
			observer.observe(el);
		}

		return () => observer.disconnect();
	}, [courseChapters.data, colorThemes.length]);

	if (enrolledCourses.isLoading) {
		return <div>Loading your courses...</div>;
	}

	// Filter enrollments for selected course
	const selectedEnrollment = enrolledCourses.data?.enrollments.find(
		(e) => e.courseId === selectedCourseId,
	);

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white">
			{/* ───────── STICKY TOP BAR + PANTHA CARD ───────── */}
			<div className="sticky top-0 z-50 bg-linear-to-b from-gray-900 via-gray-900 to-gray-900/95 px-4 pb-4 shadow-lg">
				{/* TOP SAFE SPACE */}
				<div className="h-2" />

				{/* TOP BAR: SINGLE ROW */}
				<div className="flex justify-between grid-cols-4">
					{/* Course Icon Button - Opens drawer */}
					<Button
						onClick={() => setShowCourseDrawer(!showCourseDrawer)}
						className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"
					>
						<span className="text-white font-bold text-xl">📚</span>
					</Button>

					{/* Streak */}
					<div className="flex items-center gap-1.5 rounded-full px-3 py-2 shrink-0">
						<span className="text-xl">🔥</span>
						<p className="text-sm font-bold text-orange-400">5</p>
					</div>

					{/* Gems/Earnings */}
					<div className="flex items-center gap-1.5 rounded-full px-3 py-2 shrink-0">
						<span className="text-xl">💎</span>
						<p className="text-sm font-bold text-yellow-400">1,250</p>
					</div>

					{/* Energy */}
					<div className="flex items-center gap-1.5 rounded-full px-3 py-2 shrink-0">
						<span className="text-xl">⚡</span>
						<p className="text-sm font-bold text-blue-400">85</p>
					</div>
				</div>

				{/* COURSE DRAWER (SLIDES DOWN) */}
				<div
					className={`bg-gray-800 rounded-2xl p-4 overflow-hidden transition-all duration-300 ease-in-out ${
						showCourseDrawer
							? "max-h-752 opacity-100 mb-4"
							: "max-h-0 opacity-0 p-0"
					}`}
				>
					<h3 className="text-sm font-semibold mb-3 text-gray-300">
						Your Courses
					</h3>
					<div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
						{enrolledCourses.data?.enrollments.map((enrollment) => (
							<CourseIcon
								key={enrollment.courseId}
								courseId={enrollment.courseId}
								isActive={selectedCourseId === enrollment.courseId}
								onClick={() => {
									setSelectedCourseId(enrollment.courseId);
									setShowCourseDrawer(false);
								}}
							/>
						))}

						{/* Add Course Button */}
						<div className="flex flex-col items-center gap-2 min-w-20">
							<Button
								onClick={() => router.navigate({ to: "/onboarding" })}
								className="w-14 h-14 rounded-xl bg-gray-700 hover:bg-green-600 flex items-center justify-center cursor-pointer transition-all border-2 border-dashed border-gray-500 hover:border-green-500"
							>
								<span className="text-white font-bold text-2xl">+</span>
							</Button>
							<p className="text-xs text-gray-300 text-center">Add Course</p>
						</div>
					</div>
				</div>

				{/* PANTHA STREAK CARD */}
				<div
					className={`rounded-2xl p-5 flex items-center gap-4 transition-colors duration-300 ${
						colorThemes[currentThemeIndex].card
					}`}
				>
					<img src="/pantha.png" alt="Pantha" className="w-16 h-16" />

					<div>
						<p className="text-sm text-gray-400">Your current streak</p>
						<p className="text-xl font-bold text-green-400">🔥 5 days</p>
						<p className="text-xs text-gray-400 mt-1">Pantha is proud of you</p>
					</div>
				</div>
			</div>

			{/* ───────── SCROLLABLE CONTENT ───────── */}
			<div className="px-4 pb-28 pt-6">
				{/* SELECTED COURSE INFO & LEARNING PATH */}
				<div>
					{/* Course Title & Description */}
					{selectedCourseDetails.isLoading ? (
						<div className="mb-6">
							<div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-2" />
							<div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
						</div>
					) : (
						<div className="mb-6">
							<h2 className="text-2xl font-bold mb-2 text-white">
								{selectedCourseDetails.data?.title || "Select a course"}
							</h2>
							{selectedCourseDetails.data?.description && (
								<p className="text-sm text-gray-400 leading-relaxed">
									{selectedCourseDetails.data.description}
								</p>
							)}
						</div>
					)}

					{/* Learning Path Heading */}
					<h3 className="text-lg font-semibold mb-4 text-gray-200">
						Learning Path
					</h3>

					<div className="space-y-6">
						{courseChapters.isLoading ? (
							// Loading state for chapters
							[1, 2, 3].map((index) => (
								<div key={index} className="flex items-start gap-4">
									<div className="flex flex-col items-center">
										<div className="w-5 h-5 rounded-full bg-gray-700 animate-pulse" />
										{index !== 3 && <div className="w-0.5 h-16 bg-gray-600" />}
									</div>
									<div className="flex-1 bg-gray-800 rounded-xl p-4">
										<div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-2" />
										<div className="h-5 w-full bg-gray-700 rounded animate-pulse" />
									</div>
								</div>
							))
						) : courseChapters.data &&
							courseChapters.data.chapters.length > 0 ? (
							// Display actual chapters
							courseChapters.data.chapters.map((chapter, index) => {
								const colorThemeIndex =
									Math.floor(index / 15) % colorThemes.length;
								const currentTheme = colorThemes[colorThemeIndex];

								return (
									<div
										key={chapter.id}
										data-chapter-index={index}
										className="flex items-start gap-4"
									>
										{/* Path Dot */}
										<div className="flex flex-col items-center">
											<div
												className={`w-5 h-5 rounded-full transition-colors duration-300 ${
													currentTheme.dot
												}`}
											/>
											{index !== courseChapters.data.chapters.length - 1 && (
												<div className="w-0.5 h-16 bg-gray-600" />
											)}
										</div>

										{/* Chapter Card */}
										<button
											type="button"
											onClick={() =>
												router.navigate({
													to: `/course/${selectedCourseId}/chapter/${chapter.id}`,
												})
											}
											className="flex-1 bg-gray-900 rounded-xl p-4 hover:bg-gray-700 transition text-left border-0 w-full"
										>
											<p className="text-sm text-gray-400">
												Chapter {index + 1}
											</p>
											<p className="font-semibold text-white">
												{chapter.title}
											</p>
											{chapter.description && (
												<p className="text-xs text-gray-400 mt-1">
													{chapter.description}
												</p>
											)}
										</button>
									</div>
								);
							})
						) : selectedEnrollment ? (
							<p className="text-gray-400">
								No chapters available yet for this course.
							</p>
						) : (
							<p className="text-gray-400">Select a course to see chapters</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

import { usePanthaContext } from "@pantha/react";
import {
	useCourseById,
	useCourseChaptersByCourseId,
	useUserCourses,
	useUserInfo,
} from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Button from "../../shared/components/Button";

// Component to display course icon with title
function CourseIcon({
	courseId,
	isActive,
	progressLabel,
	onClick,
}: {
	courseId: string;
	isActive: boolean;
	progressLabel: string;
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
			className={`min-w-52 rounded-3xl border p-3 text-left transition-all ${
				isActive
					? "border-green-400/60 bg-green-500/15 shadow-lg shadow-green-500/10"
					: "border-gray-700 bg-gray-800/70 hover:border-gray-500 hover:bg-gray-800"
			}`}
			onClick={onClick}
		>
			<div className="flex items-center gap-3">
				<div
					className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
						isActive ? "bg-green-500 text-white" : "bg-gray-700 text-gray-100"
					}`}
				>
					<span className="text-lg font-bold">
						{courseDetails.data?.title?.charAt(0).toUpperCase() || "C"}
					</span>
				</div>
				<div className="min-w-0 flex-1">
					<p className="line-clamp-2 text-sm font-semibold leading-tight text-white">
						{courseDetails.data?.title || "Course"}
					</p>
					<p className="mt-1 text-xs text-gray-400">{progressLabel}</p>
				</div>
			</div>
		</button>
	);
}

export default function Dashboard() {
	const { wallet } = usePanthaContext();

	const enrolledCourses = useUserCourses({
		walletAddress: wallet?.account.address,
	});
	const userInfo = useUserInfo({
		walletAddress: wallet?.account.address,
	});
	const router = useRouter();

	// Scope the storage key to the current wallet so switching accounts never
	// leaks a previous user's selected course into the new session.
	const storageKey = wallet?.account.address
		? `pantha_selected_course_${wallet.account.address}`
		: null;

	const [selectedCourseId, setSelectedCourseId] = useState<
		string | undefined
	>();
	const [showCourseDrawer, setShowCourseDrawer] = useState(false);
	const [selectedChapterId, setSelectedChapterId] = useState<
		string | undefined
	>();
	const [chapterPopupId, setChapterPopupId] = useState<string | undefined>();

	// Fetch selected course details
	const selectedCourseDetails = useCourseById({
		id: selectedCourseId,
	});

	// Fetch chapters for selected course
	const courseChapters = useCourseChaptersByCourseId({
		courseId: selectedCourseId,
	});

	// When the wallet address changes (account switch), wipe the current
	// selection so the old course is never shown for the new user.
	const walletAddress = wallet?.account.address;
	useEffect(() => {
		setSelectedCourseId(undefined);
	}, [walletAddress]);

	// Restore the previously selected course for this wallet when available,
	// otherwise fall back to the first enrolled course.
	useEffect(() => {
		if (!enrolledCourses.data?.courses.length) {
			return;
		}

		const availableCourseIds = new Set(
			enrolledCourses.data.courses.map((course) => course.courseId),
		);
		const storedCourseId = storageKey
			? (sessionStorage.getItem(storageKey) ?? undefined)
			: undefined;

		if (selectedCourseId && availableCourseIds.has(selectedCourseId)) {
			return;
		}

		const nextCourseId =
			(storedCourseId && availableCourseIds.has(storedCourseId)
				? storedCourseId
				: undefined) ?? enrolledCourses.data.courses[0]?.courseId;

		if (nextCourseId) {
			setSelectedCourseId(nextCourseId);
		}
	}, [enrolledCourses.data, selectedCourseId, storageKey]);

	useEffect(() => {
		if (!storageKey || !selectedCourseId) {
			return;
		}

		sessionStorage.setItem(storageKey, selectedCourseId);
	}, [selectedCourseId, storageKey]);

	useEffect(() => {
		if (
			enrolledCourses.data !== undefined &&
			enrolledCourses.data.courses.length === 0
		) {
			router.navigate({ to: "/onboarding" });
		}
	}, [enrolledCourses.data, router]);

	// Filter enrollments for selected course
	const selectedEnrollment = enrolledCourses.data?.courses.find(
		(e) => e.courseId === selectedCourseId,
	);
	const chapters = courseChapters.data?.chapters ?? [];
	const totalChapters = chapters.length;
	const completedChapters = Math.min(
		selectedEnrollment?.progress ?? 0,
		totalChapters,
	);
	const progressPercent =
		totalChapters > 0
			? Math.round((completedChapters / totalChapters) * 100)
			: 0;
	const remainingChapters = Math.max(totalChapters - completedChapters, 0);
	const currentStreak = userInfo.data?.user.streak.currentStreak ?? 0;
	const fallbackChapter =
		chapters[Math.min(completedChapters, Math.max(chapters.length - 1, 0))];
	const selectedChapter =
		chapters.find((chapter) => chapter.id === selectedChapterId) ??
		fallbackChapter ??
		chapters[0];
	const popupChapter =
		chapters.find((chapter) => chapter.id === chapterPopupId) ?? null;
	const popupChapterIndex = popupChapter
		? chapters.findIndex((chapter) => chapter.id === popupChapter.id)
		: -1;
	const popupChapterCompleted =
		popupChapterIndex >= 0 && popupChapterIndex < completedChapters;
	const popupChapterCurrent = popupChapterIndex === completedChapters;
	const popupChapterLocked = popupChapterIndex > completedChapters;

	useEffect(() => {
		if (chapters.length === 0) {
			setSelectedChapterId(undefined);
			setChapterPopupId(undefined);
			return;
		}

		const maxSelectableIndex = Math.min(completedChapters, chapters.length - 1);
		const selectableChapterIds = new Set(
			chapters.slice(0, maxSelectableIndex + 1).map((chapter) => chapter.id),
		);

		if (selectedChapterId && selectableChapterIds.has(selectedChapterId)) {
			return;
		}

		setSelectedChapterId(chapters[maxSelectableIndex]?.id);
	}, [chapters, completedChapters, selectedChapterId]);

	useEffect(() => {
		if (!chapterPopupId) {
			return;
		}

		const exists = chapters.some((chapter) => chapter.id === chapterPopupId);

		if (!exists) {
			setChapterPopupId(undefined);
		}
	}, [chapterPopupId, chapters]);

	const heroMessage = (() => {
		if (!selectedCourseId) {
			return "Choose a course to continue your learning path.";
		}

		if (totalChapters === 0) {
			return "Your course is getting ready. New chapters will appear here soon.";
		}

		if (completedChapters === 0) {
			return "Start your first chapter and build momentum today.";
		}

		if (completedChapters >= totalChapters) {
			return "Amazing work — you have completed this course.";
		}

		return `${remainingChapters} chapter${remainingChapters === 1 ? "" : "s"} left to finish this course.`;
	})();

	function getPathOffset(index: number) {
		const offsets = [0, 54, -34, 72, -50, 20, -16, 46];
		return offsets[index % offsets.length] ?? 0;
	}

	function handleChapterStart(chapterId?: string) {
		const chapterToStart =
			chapters.find((chapter) => chapter.id === chapterId) ?? selectedChapter;
		const chapterIndex = chapterToStart
			? chapters.findIndex((chapter) => chapter.id === chapterToStart.id)
			: -1;

		if (
			!chapterToStart ||
			chapterIndex > completedChapters ||
			!selectedCourseId
		) {
			return;
		}

		router.navigate({
			to: `/course/${selectedCourseId}/chapter/${chapterToStart.id}`,
		});
	}

	if (enrolledCourses.isLoading) {
		return <div>Loading your courses...</div>;
	}

	return (
		<div className="min-h-screen bg-linear-to-b from-[#101828] via-[#122033] to-[#0f172a] text-white pb-32">
			{/* ───────── STICKY TOP BAR + PANTHA CARD ───────── */}
			<div className="sticky top-0 z-50 border-b border-white/5 bg-linear-to-b from-[#101828] via-[#101828] to-[#101828]/95 px-4 pb-3 shadow-lg backdrop-blur-xl">
				{/* TOP SAFE SPACE */}
				<div className="h-1" />

				{/* TOP BAR: SINGLE ROW */}
				<div className="flex items-center justify-between gap-2">
					{/* Course Icon Button - Opens drawer */}
					<Button
						onClick={() => setShowCourseDrawer(!showCourseDrawer)}
						variant="quantum"
						className="h-11 w-11 rounded-2xl bg-white/5 ring-1 ring-white/10"
					>
						<span className="text-xl font-bold text-white">📚</span>
					</Button>

					{/* Streak */}
					<div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
						<span className="text-xl">🔥</span>
						<p className="text-sm font-bold text-orange-400">{currentStreak}</p>
					</div>

					{/* Gems/Earnings */}
					<div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
						<span className="text-xl">💎</span>
						<p className="text-sm font-bold text-yellow-400">1,250</p>
					</div>

					{/* Energy */}
					<div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
						<span className="text-xl">⚡</span>
						<p className="text-sm font-bold text-blue-400">85</p>
					</div>
				</div>

				{/* COURSE DRAWER (SLIDES DOWN) */}
				<div
					className={`overflow-hidden rounded-3xl border border-white/10 bg-[#192334] p-3 transition-all duration-300 ease-in-out ${
						showCourseDrawer
							? "max-h-752 opacity-100 mb-3 mt-2"
							: "max-h-0 opacity-0 p-0"
					}`}
				>
					<div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
									Selected course
								</p>
								<h2 className="mt-1 line-clamp-1 text-base font-extrabold text-white">
									{selectedCourseDetails.data?.title || "Select a course"}
								</h2>
								<p className="mt-1 text-sm text-gray-400">{heroMessage}</p>
							</div>
						</div>

						<div className="mt-3 flex items-center gap-3">
							<div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
								<div
									className="h-full rounded-full bg-linear-to-r from-[#58CC02] via-[#89E219] to-[#1CB0F6] transition-all duration-500"
									style={{ width: `${progressPercent}%` }}
								/>
							</div>
						</div>
					</div>

					<h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
						Your Courses
					</h3>
					<div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
						{enrolledCourses.data?.courses.map((course) => (
							<CourseIcon
								key={course.courseId}
								courseId={course.courseId}
								isActive={selectedCourseId === course.courseId}
								progressLabel={`Progress ${course.progress}`}
								onClick={() => {
									setSelectedCourseId(course.courseId);
									setShowCourseDrawer(false);
								}}
							/>
						))}

						{/* Add Course Button */}
						<div className="flex min-w-20 flex-col items-center gap-2">
							<Button
								variant="tertiary"
								className="h-10 w-10 justify-center rounded-xl border border-dashed border-white/20 bg-white/5"
								onClick={() => router.navigate({ to: "/onboarding" })}
							>
								<span className="text-white font-bold text-2xl">+</span>
							</Button>
							<p className="text-xs text-gray-300 text-center">Add Course</p>
						</div>
					</div>
				</div>
			</div>

			{/* ───────── SCROLLABLE CONTENT ───────── */}
			<div className="px-4 pb-28 pt-4">
				{/* SELECTED COURSE INFO & LEARNING PATH */}
				<div>
					{/* Course Title & Description */}
					{selectedCourseDetails.isLoading ? (
						<div className="mb-6">
							<div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-700" />
							<div className="h-4 w-full animate-pulse rounded bg-gray-700" />
						</div>
					) : (
						<div className="mb-5 flex items-center justify-between gap-4">
							<div>
								<h3 className="text-lg font-bold text-white">Learning Path</h3>
								<p className="mt-1 text-sm text-gray-400">
									Pick up where you left off and unlock the next chapter.
								</p>
							</div>
							<div className="rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 ring-1 ring-white/10">
								{completedChapters}/{totalChapters || 0} completed
							</div>
						</div>
					)}

					<div className="space-y-2">
						{courseChapters.isLoading ? (
							// Loading state for chapters
							[1, 2, 3].map((index) => (
								<div
									key={index}
									className="relative flex h-28 items-start justify-center"
								>
									<div
										className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/10 bg-[#192334] shadow-lg shadow-black/20"
										style={{
											transform: `translateX(${getPathOffset(index)}px)`,
										}}
									>
										<div className="h-6 w-6 animate-pulse rounded-full bg-gray-700" />
									</div>
								</div>
							))
						) : chapters.length > 0 ? (
							// Display actual chapters
							chapters.map((chapter, index) => {
								const isCompleted = index < completedChapters;
								const isCurrent = index === completedChapters;
								const isLocked = index > completedChapters;
								const isSelected = selectedChapter?.id === chapter.id;
								const offset = getPathOffset(index);

								return (
									<div
										key={chapter.id}
										data-chapter-index={index}
										className="relative flex h-30 items-start justify-center"
									>
										<div
											className="relative"
											style={{ transform: `translateX(${offset}px)` }}
										>
											<button
												type="button"
												onClick={() => {
													if (isLocked) {
														return;
													}

													setSelectedChapterId(chapter.id);
													setChapterPopupId(chapter.id);
												}}
												disabled={isLocked}
												className={`group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-center font-bold outline-none transition-all duration-200 ease-out will-change-transform focus:outline-none focus-visible:outline-none ${
													isCompleted
														? "bg-linear-to-b from-[#73d85f] via-[#58cc46] to-[#46b737] text-white shadow-[0_4px_0_0_#2f8f2d,0_10px_18px_rgba(34,197,94,0.20)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#2f8f2d,0_12px_22px_rgba(34,197,94,0.24)] active:translate-y-0.5 active:shadow-[0_2px_0_0_#2f8f2d,0_6px_12px_rgba(34,197,94,0.16)]"
														: isCurrent
															? "bg-linear-to-b from-[#52d3fc] via-[#1cb0f6] to-[#1697dc] text-white shadow-[0_4px_0_0_#0f6ea8,0_10px_18px_rgba(28,176,246,0.24)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#0f6ea8,0_12px_22px_rgba(28,176,246,0.28)] active:translate-y-0.5 active:shadow-[0_2px_0_0_#0f6ea8,0_6px_12px_rgba(28,176,246,0.18)]"
															: "cursor-not-allowed bg-linear-to-b from-[#3b4659] to-[#2a3446] text-slate-400 opacity-90 shadow-[0_4px_0_0_#1a2231,0_8px_16px_rgba(2,6,23,0.20)]"
												} ${isSelected ? "scale-[1.03]" : ""}`}
											>
												<span
													className={`pointer-events-none absolute inset-0.75 rounded-full bg-linear-to-b ${
														isLocked
															? "from-white/12 via-white/4 to-transparent"
															: "from-white/20 via-white/6 to-transparent"
													}`}
												/>
												<span className="pointer-events-none absolute inset-x-3 top-1.5 h-2 rounded-full bg-white/18 blur-sm" />
												<span className="relative z-10 text-base font-black tracking-tight sm:text-lg">
													{isLocked ? "🔒" : index + 1}
												</span>
											</button>
											<div className="mt-2 text-center">
												<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
													Chapter {index + 1}
												</p>
											</div>
										</div>
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

			{popupChapter && (
				<div className="fixed inset-0 z-70 flex items-center justify-center bg-[#020617]/70 px-4 py-6 backdrop-blur-sm sm:px-6">
					<button
						type="button"
						className="absolute inset-0"
						onClick={() => setChapterPopupId(undefined)}
						aria-label="Close chapter popup"
					/>
					<div className="relative max-h-[calc(100vh-3rem)] w-full max-w-sm overflow-y-auto rounded-[28px] border border-white/10 bg-linear-to-b from-[#1e2b42] to-[#182234] p-4 shadow-2xl shadow-black/40 sm:p-5">
						<div className="pointer-events-none absolute inset-x-6 top-0 h-20 rounded-full bg-white/10 blur-2xl" />
						<div className="mb-4 flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<div className="mb-2 flex flex-wrap items-center gap-2">
									<span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-300 ring-1 ring-white/5">
										Chapter {popupChapterIndex + 1}
									</span>
									<span
										className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
											popupChapterCompleted
												? "bg-green-500/20 text-green-300"
												: popupChapterCurrent
													? "bg-blue-500/20 text-blue-300"
													: "bg-white/5 text-gray-400"
										}`}
									>
										{popupChapterCompleted
											? "Completed"
											: popupChapterCurrent
												? "Ready"
												: "Locked"}
									</span>
								</div>
								<h4 className="text-lg font-extrabold leading-tight text-white">
									{popupChapter.title}
								</h4>
							</div>
							<button
								type="button"
								onClick={() => setChapterPopupId(undefined)}
								className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-lg text-gray-300 ring-1 ring-white/10 transition hover:bg-white/10"
								aria-label="Close chapter popup"
							>
								×
							</button>
						</div>

						{popupChapter.description && (
							<p className="text-sm leading-relaxed text-gray-400">
								{popupChapter.description}
							</p>
						)}

						<div className="mt-4 flex flex-wrap items-center gap-2">
							{popupChapterCurrent && (
								<span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
									Your next lesson
								</span>
							)}
							{popupChapterCompleted && (
								<span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
									Ready to review
								</span>
							)}
						</div>

						<div className="mt-5 flex items-center gap-3">
							<Button
								onClick={() => handleChapterStart(popupChapter.id)}
								disabled={popupChapterLocked}
								className="min-w-32 rounded-2xl border-b-6 border-b-green-800 bg-linear-to-b from-[#7fe86c] to-[#46b72f] px-5 py-3 text-white shadow-[0_12px_24px_rgba(34,197,94,0.28)] hover:from-[#8bef79] hover:to-[#4fc636] active:border-b-2"
							>
								{popupChapterCompleted ? "Review" : "Start"}
							</Button>
							<button
								type="button"
								onClick={() => setChapterPopupId(undefined)}
								className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
							>
								Later
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

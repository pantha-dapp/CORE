import { usePanthaContext } from "@pantha/react";
import {
	useCourseById,
	useCourseChaptersByCourseId,
	useUserCourses,
	useUserInfo,
} from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { Info, Lock, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHapticFeedback } from "../../shared/utils/haptics";

// Simple course name button for drawer selection
function CourseNameItem({
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
			<div className="h-11 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-dark-surface" />
		);
	}
	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
				isActive
					? "bg-purple-100 dark:bg-dark-surface text-purple-700 dark:text-dark-accent"
					: "bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-dark-muted hover:bg-purple-50 dark:hover:bg-dark-surface"
			} font-montserrat`}
		>
			{courseDetails.data?.title ?? "Course"}
		</button>
	);
}

export default function Dashboard() {
	const { wallet } = usePanthaContext();
	const hapticFeedback = useHapticFeedback();

	const [pressedCardId, setPressedCardId] = useState<string | undefined>();
	const [releasedCardId, setReleasedCardId] = useState<string | undefined>();
	const [showCourseCard, setShowCourseCard] = useState(true);
	const scrollRef = useRef<HTMLDivElement>(null);
	const lastScrollTop = useRef(0);

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

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		const currentScrollTop = el.scrollTop;
		const delta = currentScrollTop - lastScrollTop.current;
		// Only toggle after a meaningful scroll (8px threshold)
		if (delta > 8) {
			setShowCourseCard(false);
		} else if (delta < -8) {
			setShowCourseCard(true);
		}
		lastScrollTop.current = currentScrollTop;
	}, []);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		el.addEventListener("scroll", handleScroll, { passive: true });
		return () => el.removeEventListener("scroll", handleScroll);
	}, [handleScroll]);

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

		hapticFeedback.tap();

		router.navigate({
			to: `/course/${selectedCourseId}/chapter/${chapterToStart.id}`,
		});
	}

	if (enrolledCourses.isLoading) {
		return (
			<div className="bg-purple-300 dark:bg-dark-bg min-h-screen flex items-center justify-center">
				<p className="text-gray-400 dark:text-dark-muted font-montserrat">
					Loading your courses…
				</p>
			</div>
		);
	}

	return (
		<div className="bg-purple-300 dark:bg-dark-bg min-h-screen relative overflow-hidden">
			<div
				ref={scrollRef}
				className="relative h-screen overflow-y-auto px-4 pb-32"
			>
				{/* ───────── HEADER ───────── */}
				<div className="sticky top-0 z-50 pt-4 pb-3 -mx-4 px-4">
					<div className="rounded-xl bg-white/90 dark:bg-dark-card backdrop-blur-xl border border-purple-200/50 dark:border-dark-border shadow-lg shadow-purple-900/10 dark:shadow-black/20 p-3">
						<div className="flex items-center justify-between gap-3">
							<button
								type="button"
								onClick={() => setShowCourseDrawer(!showCourseDrawer)}
								className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-lg bg-purple-50 dark:bg-dark-surface px-3 text-left transition-colors hover:bg-purple-100 dark:hover:bg-dark-border"
								aria-label="Courses"
							>
								<span className="text-lg shrink-0">📚</span>
								<span className="truncate text-sm font-medium text-gray-800 dark:text-dark-text font-montserrat">
									{selectedCourseDetails.data?.title ?? "Select course"}
								</span>
								<span className="ml-auto shrink-0 text-gray-400 dark:text-dark-muted">
									▼
								</span>
							</button>

							<div className="flex items-center">
								<div className="flex items-center gap-1.5 rounded-full  px-1.5 py-1.5">
									<span className="text-sm">🔥</span>
									<span className="text-sm font-semibold text-orange-500 font-montserrat tabular-nums">
										{currentStreak}
									</span>
								</div>
								<div className="flex items-center gap-1.5 rounded-full px-1.5 py-1.5">
									<span className="text-sm">💎</span>
									<span className="text-sm font-semibold text-purple-600 font-montserrat tabular-nums">
										{userInfo.data?.user.xpCount ?? 0}
									</span>
								</div>
								<div className="flex items-center gap-1.5 rounded-full px-1.5 py-1.5">
									<span className="text-sm">⚡</span>
									<span className="text-sm font-semibold text-blue-500 font-montserrat tabular-nums">
										{userInfo.data?.user.xp ?? 0}
									</span>
								</div>
							</div>
						</div>

						{/* COURSE DRAWER */}
						<div
							className={`overflow-hidden transition-all duration-300 ease-in-out ${
								showCourseDrawer
									? "mt-3 max-h-100 opacity-100"
									: "max-h-0 opacity-0"
							}`}
						>
							<div className="space-y-1.5 border-t border-purple-200/50 dark:border-dark-border pt-3">
								{enrolledCourses.data?.courses.map((course) => (
									<CourseNameItem
										key={course.courseId}
										courseId={course.courseId}
										isActive={selectedCourseId === course.courseId}
										onClick={() => {
											hapticFeedback.tap();
											setSelectedCourseId(course.courseId);
											setShowCourseDrawer(false);
										}}
									/>
								))}
								<button
									type="button"
									onClick={() => {
										router.navigate({ to: "/onboarding" });
										setShowCourseDrawer(false);
									}}
									className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-purple-300 dark:border-dark-border bg-purple-50 dark:bg-dark-surface py-3 text-sm font-medium text-purple-400 dark:text-dark-muted transition-colors hover:border-purple-400 hover:bg-purple-100 dark:hover:bg-dark-border font-montserrat"
								>
									<span className="text-lg">+</span>
									Add course
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* ───────── COURSE DETAILS (when selected) ───────── */}
				<div
					className={`transition-all duration-300 ease-in-out overflow-hidden ${
						showCourseCard
							? "max-h-60 opacity-100 translate-y-0"
							: "max-h-0 opacity-0 -translate-y-4"
					}`}
				>
					{selectedCourseId && (
						<button
							type="button"
							onClick={() => setShowCourseDrawer(true)}
							className="my-2 w-full flex items-start gap-4 rounded-xl bg-white/80 dark:bg-dark-card backdrop-blur-sm border border-purple-200/50 dark:border-dark-border p-4 text-left transition-colors hover:bg-white/90 dark:hover:bg-dark-surface active:bg-white dark:active:bg-dark-border"
						>
							<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-100 dark:bg-dark-surface">
								{selectedCourseDetails.data?.icon ? (
									<img
										src={selectedCourseDetails.data.icon}
										alt={selectedCourseDetails.data?.title ?? "Course"}
										className="h-12 w-12 object-contain"
									/>
								) : courseChapters.data?.chapters?.[0] &&
									courseChapters.data?.icons?.[
										courseChapters.data.chapters[0].id
									] ? (
									<img
										src={
											courseChapters.data.icons[
												courseChapters.data.chapters[0].id
											]
										}
										alt={selectedCourseDetails.data?.title ?? "Course"}
										className="h-12 w-12 object-contain"
									/>
								) : (
									<span className="text-2xl">📚</span>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-base font-bold text-gray-900 dark:text-dark-text font-tusker line-clamp-1">
									{selectedCourseDetails.data?.title ?? "Course"}
								</h3>
								<p className="mt-0.5 text-sm text-gray-500 dark:text-dark-muted font-montserrat line-clamp-2">
									{selectedCourseDetails.data?.description ?? heroMessage}
								</p>
								{totalChapters > 0 && (
									<div className="mt-2 flex items-center gap-2">
										<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-purple-200 dark:bg-dark-surface">
											<div
												className="h-full rounded-full bg-purple-400 dark:bg-dark-accent transition-all"
												style={{ width: `${progressPercent}%` }}
											/>
										</div>
										<span className="text-xs font-semibold tabular-nums text-gray-500 dark:text-dark-muted">
											{progressPercent}%
										</span>
									</div>
								)}
								<p className="mt-1 text-sm text-gray-400 dark:text-dark-muted font-montserrat">
									{totalChapters > 0 ? (
										<>
											<span className="font-semibold tabular-nums text-gray-700 dark:text-dark-text">
												{completedChapters}
											</span>
											<span> of {totalChapters} chapters</span>
											{remainingChapters > 0 && (
												<span className="text-gray-400 dark:text-dark-muted">
													{" "}
													· {remainingChapters} to go
												</span>
											)}
										</>
									) : (
										(selectedCourseDetails.data?.title ?? "Select a course")
									)}
								</p>
							</div>
							<span
								className="shrink-0 text-purple-300 dark:text-dark-muted"
								aria-hidden
							>
								<Info />
							</span>
						</button>
					)}
				</div>

				{/* ───────── LEARNING PATH / ROADMAP ───────── */}
				<div className="pb-28 px-2">
					{/* Curvy roadmap with dotted line */}
					<div className="relative">
						{courseChapters.isLoading ? (
							<div className="flex flex-col items-center gap-4">
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="h-24 w-full max-w-xs rounded-xl bg-purple-200/50 dark:bg-dark-surface animate-pulse"
									/>
								))}
							</div>
						) : chapters.length > 0 ? (
							<>
								{/* Sinusoidal SVG path connecting chapters */}
								{chapters.length >= 2 &&
									(() => {
										const n = chapters.length;
										const slotH = 100;
										const viewH = Math.max(100, n * slotH);
										// Centre-Y of each chapter slot
										const ny = (i: number) => i * slotH + 50;
										// Card centre X — left cards ≈ 24%, right cards ≈ 76%
										// (matches max-w-36 cards inside px-6 container on ~375px)
										const nx = (i: number) => (i % 2 === 0 ? 24 : 76);

										let d = `M ${nx(0)} ${ny(0)}`;
										for (let i = 0; i < n - 1; i++) {
											const x1 = nx(i);
											const y1 = ny(i);
											const x2 = nx(i + 1);
											const y2 = ny(i + 1);
											// Handle at 65% of vertical distance → rounder sine curve
											const h = (y2 - y1) * 0.65;
											d += ` C ${x1} ${y1 + h}, ${x2} ${y2 - h}, ${x2} ${y2}`;
										}

										return (
											<svg
												className="absolute inset-0 w-full h-full pointer-events-none"
												viewBox={`0 0 100 ${viewH}`}
												preserveAspectRatio="none"
												aria-hidden="true"
											>
												<title>Roadmap</title>
												<path
													d={d}
													fill="none"
													stroke="rgba(139,92,246,0.35)"
													strokeWidth="2"
													strokeDasharray="7 7"
													strokeLinecap="round"
													vectorEffect="non-scaling-stroke"
												/>
												{/* Dots at each chapter node */}
												{Array.from({ length: n }).map((_, i) => (
													<circle
														key={`node-${chapters[i].id}`}
														cx={nx(i)}
														cy={ny(i)}
														r="1.8"
														fill="rgba(139,92,246,0.5)"
														vectorEffect="non-scaling-stroke"
													/>
												))}
											</svg>
										);
									})()}

								{chapters.map((chapter, index) => {
									const isCompleted = index < completedChapters;
									const isCurrent = index === completedChapters;
									const isLocked = index > completedChapters;
									const isSelected = selectedChapter?.id === chapter.id;
									const iconUrl = courseChapters.data?.icons?.[chapter.id];
									const alignRight = index % 2 === 1;

									return (
										<div
											key={chapter.id}
											className={`relative z-10 flex py-5 ${alignRight ? "justify-end" : "justify-start"}`}
										>
											<button
												type="button"
												onPointerDown={() => {
													setPressedCardId(chapter.id);
													setReleasedCardId(undefined);
												}}
												onPointerUp={() => {
													setPressedCardId(undefined);
													setReleasedCardId(chapter.id);
												}}
												onPointerLeave={() => {
													setPressedCardId(undefined);
												}}
												onClick={() => {
													hapticFeedback.tap();
													setSelectedChapterId(chapter.id);
													setChapterPopupId(chapter.id);
												}}
												onAnimationEnd={() => {
													if (releasedCardId === chapter.id) {
														setReleasedCardId(undefined);
													}
												}}
												className={`chapter-card relative w-full max-w-36 rounded-xl p-2.5 text-left focus:outline-none focus-visible:outline-none ${
													isCompleted
														? "bg-green-500 text-white shadow-lg shadow-green-600/30"
														: isCurrent
															? "bg-orange-400 text-white shadow-lg shadow-orange-500/40 ring-2 ring-orange-300/60"
															: "bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-400 dark:text-dark-muted"
												} ${isSelected ? "ring-2 ring-orange-400" : ""} ${isCurrent ? "chapter-card-current" : ""} ${pressedCardId === chapter.id ? "chapter-card-down" : ""} ${releasedCardId === chapter.id ? "chapter-card-released" : ""}`}
											>
												{/* Top: icon, chapter number, lock (if locked) */}
												<div className="relative flex items-center gap-1.5">
													<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10 overflow-hidden">
														{iconUrl ? (
															<img
																src={iconUrl}
																alt={chapter.title ?? `Chapter ${index + 1}`}
																className="h-7 w-7 object-contain"
															/>
														) : (
															<span className="text-lg font-bold">
																{index + 1}
															</span>
														)}
													</div>
													<span className="text-xs font-bold font-tusker">
														Chapter {index + 1}
													</span>
													{isLocked && (
														<span
															className="ml-auto flex items-center justify-center rounded p-1 text-gray-400 dark:text-dark-muted"
															aria-hidden
														>
															<Lock className="h-4 w-4" strokeWidth={2.5} />
														</span>
													)}
												</div>
												{/* Bottom: chapter name */}
												<p className="mt-1.5 text-[11px] font-medium line-clamp-2 font-montserrat opacity-90">
													{chapter.title || "Untitled chapter"}
												</p>
											</button>
										</div>
									);
								})}
							</>
						) : selectedEnrollment ? (
							<p className="text-gray-400 dark:text-dark-muted font-montserrat py-8 text-center">
								No chapters available yet for this course.
							</p>
						) : (
							<p className="text-gray-400 dark:text-dark-muted font-montserrat py-8 text-center">
								Select a course to see chapters
							</p>
						)}
					</div>
				</div>
			</div>

			{popupChapter && (
				<div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 sm:px-6">
					<button
						type="button"
						className="absolute inset-0"
						onClick={() => setChapterPopupId(undefined)}
						aria-label="Close chapter popup"
					/>
					<div className="relative max-h-[calc(100vh-3rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-white dark:bg-dark-card p-4 shadow-2xl shadow-purple-900/20 dark:shadow-black/40 sm:p-5">
						<div className="mb-4 flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<div className="mb-2 flex flex-wrap items-center gap-2">
									<span className="rounded-lg bg-purple-100 dark:bg-dark-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-purple-600 dark:text-dark-accent font-tusker">
										Chapter {popupChapterIndex + 1}
									</span>
									<span
										className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] font-tusker ${
											popupChapterCompleted
												? "bg-purple-100 dark:bg-green-900/20 text-purple-600 dark:text-green-400"
												: popupChapterCurrent
													? "bg-fuchsia-100 dark:bg-orange-900/20 text-fuchsia-600 dark:text-orange-400"
													: "bg-gray-100 dark:bg-dark-surface text-gray-400 dark:text-dark-muted"
										}`}
									>
										{popupChapterCompleted
											? "Completed"
											: popupChapterCurrent
												? "Ready"
												: "Locked"}
									</span>
								</div>
								<h4 className="text-lg mt-6 font-bold leading-tight text-gray-900 dark:text-dark-text font-tusker">
									{popupChapter.title}
								</h4>
							</div>
							<button
								type="button"
								onClick={() => setChapterPopupId(undefined)}
								className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-surface text-gray-400 dark:text-dark-muted hover:bg-gray-200 dark:hover:bg-dark-border transition-colors font-montserrat"
								aria-label="Close chapter popup"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{popupChapter.description && (
							<p className="text-sm leading-relaxed text-gray-500 dark:text-dark-muted font-montserrat">
								{popupChapter.description}
							</p>
						)}

						<div className="mt-4 flex flex-wrap items-center gap-2">
							{popupChapterCurrent && (
								<span className="rounded-lg bg-fuchsia-100 dark:bg-orange-900/20 px-3 py-1 text-xs font-semibold text-fuchsia-600 dark:text-orange-400 font-montserrat">
									Your next lesson
								</span>
							)}
							{popupChapterCompleted && (
								<span className="rounded-lg bg-purple-100 dark:bg-green-900/20 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-green-400 font-montserrat">
									Ready to review
								</span>
							)}
						</div>

						<div className="mt-5 flex items-center gap-3">
							<button
								type="button"
								onClick={() => handleChapterStart(popupChapter.id)}
								disabled={popupChapterLocked}
								className="min-w-32 rounded-lg px-5 py-3 font-medium font-montserrat bg-purple-600 dark:bg-dark-accent text-white hover:bg-purple-700 dark:hover:bg-indigo-500 disabled:bg-gray-100 dark:disabled:bg-dark-surface disabled:text-gray-300 dark:disabled:text-dark-muted disabled:cursor-not-allowed"
							>
								{popupChapterLocked
									? "Locked"
									: popupChapterCompleted
										? "Review"
										: "Start"}
							</button>
							<button
								type="button"
								onClick={() => setChapterPopupId(undefined)}
								className="rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface px-4 py-3 text-sm font-semibold text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border font-montserrat"
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

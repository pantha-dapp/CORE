import { useEvent, usePanthaContext } from "@pantha/react";
import {
	useCourseById,
	useCourseChaptersByCourseId,
	useFeedPost,
	useRequestCertificate,
	useUserCourses,
	useUserInfo,
} from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { Check, Lock, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShareToFeedModal } from "../../shared/components/ShareToFeedModal";
import { useHapticFeedback } from "../../shared/utils/haptics";

function ChapterRow({
	chapter,
	index,
	alignRight,
	isCompleted,
	isCurrent,
	isLocked,
	iconUrl,
	isInView,
	onClick,
	onPointerDown,
	onPointerUp,
	onPointerLeave,
	onAnimationEnd,
	pressedCardId,
	rowRef,
}: {
	chapter: { id: string; title?: string };
	index: number;
	alignRight: boolean;
	isCompleted: boolean;
	isCurrent: boolean;
	isLocked: boolean;
	iconUrl?: string;
	isInView: boolean;
	onClick: () => void;
	onPointerDown: () => void;
	onPointerUp: () => void;
	onPointerLeave: () => void;
	onAnimationEnd: () => void;
	pressedCardId?: string;
	rowRef: (el: HTMLDivElement | null) => void;
}) {
	const wasInView = useRef(false);
	const animClass = (() => {
		if (isInView) {
			wasInView.current = true;
			return alignRight
				? "animate-chapter-from-right"
				: "animate-chapter-from-left";
		}
		if (wasInView.current) {
			return alignRight
				? "animate-chapter-out-right"
				: "animate-chapter-out-left";
		}
		return "opacity-0";
	})();

	return (
		<div
			ref={rowRef}
			className={`relative z-10 flex items-start py-6 ${
				alignRight ? "justify-end" : "justify-start"
			}`}
		>
			<button
				type="button"
				onPointerDown={onPointerDown}
				onPointerUp={onPointerUp}
				onPointerLeave={onPointerLeave}
				onClick={onClick}
				onAnimationEnd={onAnimationEnd}
				className={`flex flex-col w-[calc(50%-2rem)] max-w-48 min-w-0 focus:outline-none focus-visible:outline-none transition-opacity ${
					alignRight
						? "pl-6 items-end text-right"
						: "pr-6 items-start text-left"
				} ${pressedCardId === chapter.id ? "opacity-80" : ""} ${animClass}`}
			>
				<div
					className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden mb-1.5 ${
						isCompleted
							? "bg-dark-accent/20"
							: isCurrent
								? "bg-dark-accent/20"
								: "bg-dark-surface"
					}`}
				>
					{iconUrl ? (
						<img src={iconUrl} alt="" className="h-10 w-10 object-contain" />
					) : (
						<span className="text-base font-bold text-dark-text">
							{index + 1}
						</span>
					)}
				</div>
				<span className="text-[10px] font-semibold uppercase tracking-wider text-dark-muted mb-0.5">
					Chapter {index + 1}
				</span>
				<h4
					className={`text-lg font-bold leading-tight font-titillium ${
						isLocked
							? "text-dark-muted"
							: isCompleted
								? "text-dark-accent"
								: isCurrent
									? "text-dark-text"
									: "text-dark-text"
					}`}
				>
					{chapter.title || "Untitled chapter"}
				</h4>
			</button>

			{/* Lock on line - always visible */}
			<div className="absolute left-1/2 top-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 shrink-0 pointer-events-none">
				{isCompleted ? (
					<div className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-success/20 border-2 border-dark-success">
						<Check className="h-5 w-5 text-dark-success" strokeWidth={2.5} />
					</div>
				) : isLocked ? (
					<div className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-surface border-2 border-dark-border">
						<Lock className="h-5 w-5 text-dark-muted" strokeWidth={2.5} />
					</div>
				) : (
					<div className="w-4 h-4 shrink-0 rounded-full bg-dark-accent" />
				)}
			</div>
		</div>
	);
}

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
			<div className="h-11 w-full animate-pulse rounded-xl bg-dark-surface" />
		);
	}
	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors font-titillium ${
				isActive
					? "bg-dark-surface text-dark-accent"
					: "text-dark-muted hover:bg-dark-surface/60 hover:text-dark-text"
			}`}
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
	const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
	const [chaptersInView, setChaptersInView] = useState<Set<number>>(new Set());
	const [showProgressCard, setShowProgressCard] = useState(true);
	const [progressCardClosing, setProgressCardClosing] = useState(false);
	const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

	const setScrollRef = useCallback((el: HTMLDivElement | null) => {
		(scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
		setScrollEl(el);
	}, []);

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
	const [popupClosing, setPopupClosing] = useState(false);

	useEffect(() => {
		if (chapterPopupId) setPopupClosing(false);
	}, [chapterPopupId]);

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
	const feedPost = useFeedPost();
	const requestCertificate = useRequestCertificate();
	const [certRequested, setCertRequested] = useState(false);
	const [pendingFeedStreak, setPendingFeedStreak] = useState<number | null>(
		null,
	);
	useEvent("streak:extended", (payload) => {
		setPendingFeedStreak(payload.currentStreak);
	});
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
		let rafId: number;
		const onScroll = () => {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => handleScroll());
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		handleScroll(); // initial
		return () => {
			el.removeEventListener("scroll", onScroll);
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [handleScroll]);

	// Intersection Observer: chapters in/out of view (slide-in and slide-out)
	useEffect(() => {
		if (!scrollEl || chapters.length === 0) return;
		const observers: IntersectionObserver[] = [];
		const id = setTimeout(() => {
			for (let i = 0; i < chapters.length; i++) {
				const el = rowRefs.current[i];
				if (!el) continue;
				const index = i;
				const obs = new IntersectionObserver(
					([entry]) => {
						setChaptersInView((prev) => {
							const next = new Set(prev);
							if (entry.isIntersecting) {
								next.add(index);
							} else {
								next.delete(index);
							}
							return next;
						});
					},
					{
						root: scrollEl,
						threshold: 0.01,
						rootMargin: "0px 0px 100px 0px", // extend downward so chapters trigger before fully in view
					},
				);
				obs.observe(el);
				observers.push(obs);
			}
		}, 100); // ensure refs are populated after render
		return () => {
			clearTimeout(id);
			observers.forEach((o) => {
				o.disconnect();
			});
		};
	}, [scrollEl, chapters.length]);

	function handleClosePopup() {
		setPopupClosing(true);
	}

	function handlePopupAnimationEnd() {
		if (popupClosing) {
			setChapterPopupId(undefined);
			setPopupClosing(false);
		}
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

		hapticFeedback.tap();

		router.navigate({
			to: `/course/${selectedCourseId}/chapter/${chapterToStart.id}`,
		});
	}

	if (enrolledCourses.isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center dark:bg-dark-bg">
				<p className="text-dark-muted font-titillium">Loading your courses…</p>
			</div>
		);
	}

	return (
		<>
			<div className="dark min-h-screen relative overflow-hidden bg-dark-bg">
				{/* Gradient background - animated pulse */}
				<div
					className="fixed inset-0 pointer-events-none animate-gradient-bg"
					aria-hidden
					style={{
						background:
							"radial-gradient(ellipse 80% 50% at 50% 15%, rgba(30, 44, 72, 0.4) 0%, transparent 50%), radial-gradient(ellipse 60% 80% at 80% 55%, rgba(129, 140, 248, 0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 60% at 20% 90%, rgba(129, 140, 248, 0.06) 0%, transparent 50%)",
					}}
				/>
				<div
					ref={setScrollRef}
					className="relative h-screen overflow-y-auto overflow-x-hidden px-4 pb-40"
				>
					{/* ───────── HEADER ───────── */}
					<div className="sticky top-0 z-50 pt-4 pb-3 -mx-4 px-4">
						<div className="rounded-2xl bg-dark-card/95 backdrop-blur-xl border-0 shadow-xl p-3 font-titillium">
							<div className="flex items-center justify-between gap-3">
								<button
									type="button"
									onClick={() => setShowCourseDrawer(!showCourseDrawer)}
									className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl bg-dark-surface px-3 text-left transition-colors hover:bg-dark-border/50"
									aria-label="Courses"
								>
									<span className="text-lg shrink-0">📚</span>
									<span className="truncate text-sm font-semibold text-dark-text">
										{selectedCourseDetails.data?.title ?? "Select course"}
									</span>
									<span className="ml-auto shrink-0 text-dark-muted">▼</span>
								</button>

								<div className="flex items-center gap-1">
									<div className="flex items-center gap-1 rounded-full px-2 py-1 bg-dark-surface">
										<span className="text-sm">🔥</span>
										<span className="text-xs font-semibold text-dark-accent tabular-nums">
											{currentStreak}
										</span>
									</div>
									<div className="flex items-center gap-1 rounded-full px-2 py-1 bg-dark-surface">
										<span className="text-sm">💎</span>
										<span className="text-xs font-semibold text-dark-accent tabular-nums">
											{userInfo.data?.user.xpCount ?? 0}
										</span>
									</div>
									<div className="flex items-center gap-1 rounded-full px-2 py-1 bg-dark-surface">
										<span className="text-sm">⚡</span>
										<span className="text-xs font-semibold text-dark-accent tabular-nums">
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
								<div className="space-y-1.5 border-t border-dark-border pt-3 mt-3">
									{showCourseDrawer && (
										<>
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
												className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-dark-border bg-dark-surface/50 py-3 text-sm font-medium text-dark-muted transition-colors hover:bg-dark-surface hover:text-dark-text"
											>
												<span className="text-lg">+</span>
												Add course
											</button>
										</>
									)}
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
							<div className="my-2 w-full flex flex-col items-center justify-center gap-4 rounded-2xl backdrop-blur-sm border-0 p-4 text-left transition-colors hover:bg-dark-surface/60 active:bg-dark-border/30 font-titillium">
								<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-dark-surface text-center">
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
								<div className="min-w-0 flex-1 text-center">
									<h3 className="text-xl font-bold text-dark-text line-clamp-2">
										{selectedCourseDetails.data?.title ?? "Course"}
									</h3>
									<p className="mt-0.5 text-sm text-dark-muted line-clamp-3">
										{selectedCourseDetails.data?.description ?? heroMessage}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* ───────── LEARNING PATH (straight line, alternating) ───────── */}
					<div className="pb-4 px-0">
						<div className="relative w-full max-w-md mx-auto">
							{courseChapters.isLoading ? (
								<div className="flex flex-col items-center gap-6 py-8">
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="h-20 w-3/4 max-w-xs rounded-xl bg-dark-surface animate-pulse"
										/>
									))}
								</div>
							) : chapters.length > 0 ? (
								<>
									{/* Central vertical line - full height, all locks visible */}
									<div
										className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 bg-dark-border/60 z-0 pointer-events-none"
										aria-hidden
									/>
									{chapters.map((chapter, index) => (
										<ChapterRow
											key={chapter.id}
											chapter={chapter}
											index={index}
											alignRight={index % 2 === 1}
											isCompleted={index < completedChapters}
											isCurrent={index === completedChapters}
											isLocked={index > completedChapters}
											iconUrl={courseChapters.data?.icons?.[chapter.id]}
											isInView={chaptersInView.has(index)}
											onClick={() => {
												hapticFeedback.tap();
												setSelectedChapterId(chapter.id);
												setChapterPopupId(chapter.id);
											}}
											onPointerDown={() => {
												setPressedCardId(chapter.id);
												setReleasedCardId(undefined);
											}}
											onPointerUp={() => {
												setPressedCardId(undefined);
												setReleasedCardId(chapter.id);
											}}
											onPointerLeave={() => setPressedCardId(undefined)}
											onAnimationEnd={() => {
												if (releasedCardId === chapter.id) {
													setReleasedCardId(undefined);
												}
											}}
											pressedCardId={pressedCardId}
											rowRef={(el) => {
												rowRefs.current[index] = el;
											}}
										/>
									))}
								</>
							) : selectedEnrollment ? (
								<p className="text-dark-muted font-titillium py-12 text-center">
									No chapters available yet for this course.
								</p>
							) : (
								<p className="text-dark-muted font-titillium py-12 text-center">
									Select a course to see chapters
								</p>
							)}
						</div>
					</div>
				</div>

				{popupChapter && (
					<div
						className={`fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 sm:px-6 ${popupClosing ? "animate-popup-backdrop-out" : "animate-popup-backdrop-in"}`}
					>
						<button
							type="button"
							className="absolute inset-0"
							onClick={handleClosePopup}
							aria-label="Close chapter popup"
						/>
						<div
							className={`relative max-h-[calc(100vh-3rem)] w-full max-w-sm overflow-y-auto rounded-2xl bg-dark-card/95 backdrop-blur-xl shadow-2xl p-4 font-titillium border border-dark-border/50 ${
								popupChapterIndex % 2 === 0
									? popupClosing
										? "animate-popup-content-out-left"
										: "animate-popup-content-in-left"
									: popupClosing
										? "animate-popup-content-out-right"
										: "animate-popup-content-in-right"
							}`}
							onAnimationEnd={handlePopupAnimationEnd}
						>
							<div className="mb-3 flex items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<div className="mb-1.5 flex flex-wrap items-center gap-1.5">
										<span className="rounded-lg bg-dark-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dark-accent">
											Chapter {popupChapterIndex + 1}
										</span>
										<span
											className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
												popupChapterCompleted
													? "bg-dark-success/20 text-dark-success"
													: popupChapterCurrent
														? "bg-dark-accent/20 text-dark-accent"
														: "bg-dark-surface text-dark-muted"
											}`}
										>
											{popupChapterCompleted
												? "Completed"
												: popupChapterCurrent
													? "Ready"
													: "Locked"}
										</span>
									</div>
									<h4 className="text-lg font-bold leading-tight text-dark-text mt-2">
										{popupChapter.title}
									</h4>
								</div>
								<button
									type="button"
									onClick={handleClosePopup}
									className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dark-surface text-dark-muted hover:bg-dark-border transition-colors"
									aria-label="Close chapter popup"
								>
									<X className="h-4 w-4" />
								</button>
							</div>

							{popupChapter.description && (
								<p className="text-sm leading-relaxed text-dark-muted">
									{popupChapter.description}
								</p>
							)}

							<div className="mt-3 flex flex-wrap items-center gap-1.5">
								{popupChapterCurrent && (
									<span className="rounded-lg bg-dark-accent/20 px-2 py-0.5 text-[11px] font-semibold text-dark-accent">
										Your next lesson
									</span>
								)}
								{popupChapterCompleted && (
									<span className="rounded-lg bg-dark-success/20 px-2 py-0.5 text-[11px] font-semibold text-dark-success">
										Ready to review
									</span>
								)}
							</div>

							<div className="mt-4 flex items-center gap-2">
								<button
									type="button"
									onClick={() => handleChapterStart(popupChapter.id)}
									disabled={popupChapterLocked}
									className="min-w-28 rounded-lg px-4 py-2 text-sm font-semibold bg-dark-accent text-white hover:bg-dark-accent/90 disabled:bg-dark-surface disabled:text-dark-muted disabled:cursor-not-allowed transition-colors"
								>
									{popupChapterLocked
										? "Locked"
										: popupChapterCompleted
											? "Review"
											: "Start"}
								</button>
								<button
									type="button"
									onClick={handleClosePopup}
									className="rounded-lg bg-dark-surface px-3 py-2 text-sm font-semibold text-dark-muted hover:bg-dark-border transition-colors"
								>
									Later
								</button>
							</div>
						</div>
					</div>
				)}

				{/* ───────── FIXED BOTTOM PROGRESS (above nav) ───────── */}
				{selectedCourseId && totalChapters > 0 && (
					<div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto">
						{showProgressCard ? (
							<button
								type="button"
								onClick={() => {
									hapticFeedback.tap();
									setProgressCardClosing(true);
								}}
								className={`rounded-2xl bg-dark-card/95 w-full backdrop-blur-xl shadow-xl px-5 py-4 font-titillium border-0 ${
									progressCardClosing
										? "animate-progress-card-out"
										: "animate-progress-card-in"
								}`}
								onAnimationEnd={() => {
									if (progressCardClosing) {
										setShowProgressCard(false);
										setProgressCardClosing(false);
									}
								}}
							>
								<div className="flex items-center justify-between gap-3 mb-3">
									<div className="flex items-center justify-between flex-1">
										<div className="flex flex-col items-start justify-center">
											<p className="text-[10px] font-semibold uppercase tracking-wider text-dark-muted">
												Your progress
											</p>
											<p className="text-2xl font-bold text-dark-text tabular-nums">
												{progressPercent}%
											</p>
										</div>
										<div className="text-right">
											<p className="text-[10px] font-semibold uppercase tracking-wider text-dark-muted">
												Chapters
											</p>
											<p className="text-2xl font-bold text-dark-text tabular-nums">
												{completedChapters} / {totalChapters}
											</p>
										</div>
									</div>
								</div>
								<div className="h-2 w-full overflow-hidden rounded-full bg-dark-surface">
									<div
										className="h-full rounded-full bg-dark-accent transition-all duration-500"
										style={{ width: `${progressPercent}%` }}
									/>
								</div>
								{completedChapters > 10 && selectedCourseId && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											if (certRequested || requestCertificate.isPending) return;
											requestCertificate.mutate(selectedCourseId, {
												onSuccess: () => setCertRequested(true),
											});
										}}
										disabled={certRequested || requestCertificate.isPending}
										className="mt-3 w-full rounded-xl bg-dark-accent px-4 py-2.5 text-sm font-semibold text-dark-bg font-montserrat transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
									>
										{requestCertificate.isPending
											? "Requesting…"
											: certRequested
												? "✓ Certificate Requested!"
												: `🎓 Request Certificate (${progressPercent}%)`}
									</button>
								)}
								{requestCertificate.isError && (
									<p className="mt-2 text-xs text-red-400 font-montserrat text-center">
										{(requestCertificate.error as Error)?.message ??
											"Failed to request certificate"}
									</p>
								)}
							</button>
						) : (
							<div className="flex justify-center">
								<button
									type="button"
									onClick={() => setShowProgressCard(true)}
									className="rounded-2xl bg-dark-card/95 backdrop-blur-xl shadow-xl px-5 py-2.5 text-sm font-semibold text-dark-text hover:bg-dark-surface/80 transition-colors font-titillium animate-progress-button-in"
								>
									Show progress
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{pendingFeedStreak !== null && (
				<ShareToFeedModal
					emoji="🔥"
					title={`${pendingFeedStreak}-Day Streak!`}
					description="You extended your learning streak. Share it with your friends?"
					onConfirm={() => {
						feedPost.mutate({ type: "streak-extension" });
						setPendingFeedStreak(null);
					}}
					onDismiss={() => setPendingFeedStreak(null)}
					isLoading={feedPost.isPending}
				/>
			)}
		</>
	);
}

import { usePanthaContext } from "@pantha/react";
import {
	useCourseGenerationAction,
	useCourseGenerationMajorCategories,
	useCourseGenerationSession,
	useCourseGenerationSessionReset,
	useJobStatus,
	useUserCourses,
} from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import Icon from "../../shared/components/Icon";

export default function Onboarding() {
	const session = useCourseGenerationSession();
	const { data: actionData, mutate: action } = useCourseGenerationAction();
	const jobState = useJobStatus({ jobId: actionData?.awaitedJobId });
	const majorCategories = useCourseGenerationMajorCategories();
	const resetSession = useCourseGenerationSessionReset();
	const router = useRouter();
	const [learningIntent, setLearningIntent] = useState("");

	const { wallet } = usePanthaContext();

	const enrolledCourses = useUserCourses({
		walletAddress: wallet?.account.address,
	});
	const currentQuestion = useMemo(
		() => session.data?.session.questions.find((q) => !q.answer),
		[session.data],
	);

	useEffect(() => {
		if (enrolledCourses.data && session.data?.session.state === "finished") {
			router.navigate({ to: "/dashboard" });
		}
	}, [enrolledCourses.data, router, session.data?.session.state]);

	const stepIndex =
		session.data?.session.state === "major_category_choice"
			? 0
			: session.data?.session.state === "learning_intent_freetext"
				? 1
				: session.data?.session.state === "answer_question"
					? 2
					: 3;

	const steps = [
		{ label: "Category", icon: "folder" as const },
		{ label: "Intent", icon: "edit" as const },
		{ label: "Questions", icon: "message-circle" as const },
	];

	return (
		<div className="min-h-screen relative overflow-hidden bg-landing-hero-bg dark:bg-dark-bg">
			<div className="absolute  pointer-events-auto flex flex-col items-center px-4 py-8 pb-24">
				<div className="w-full max-w-xl space-y-6 shrink-0">
					<div className="text-center space-y-1">
						<h1 className="text-4xl font-bold tracking-tight text-landing-hero-text dark:text-dark-text">
							Onboarding
						</h1>
						<p className="text-white/90 dark:text-dark-muted text-sm font-montserrat">
							Let's personalise your learning journey
						</p>
					</div>

					{/* Step progress */}
					<div className="flex items-center justify-between px-2">
						{steps.map((step, i) => (
							<div
								key={step.label}
								className="flex-1 flex flex-col items-center gap-1"
							>
								<div
									className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
										i < stepIndex
											? "bg-landing-button-primary dark:bg-dark-accent"
											: i === stepIndex
												? "bg-white dark:bg-dark-card ring-4 ring-white/30 dark:ring-dark-border/50"
												: "bg-white/30 dark:bg-dark-surface/50"
									}`}
								>
									{i < stepIndex ? (
										<Icon name="check" size={16} className="text-white" />
									) : (
										<Icon
											name={step.icon}
											size={16}
											className={
												i === stepIndex
													? "text-landing-hero-bg dark:text-dark-accent"
													: "text-white dark:text-dark-muted"
											}
										/>
									)}
								</div>
								<span
									className={`text-xs font-medium font-montserrat ${
										i <= stepIndex
											? "text-white dark:text-dark-text"
											: "text-white/60 dark:text-dark-muted"
									}`}
								>
									{step.label}
								</span>
							</div>
						))}
					</div>

					{/* Main card */}
					<div className="bg-white dark:bg-dark-card rounded-lg p-6 shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
						{!session.data || jobState?.data?.state === "pending" ? (
							<div className="flex flex-col items-center gap-3 py-8 text-gray-500 dark:text-dark-muted font-montserrat">
								<div className="w-10 h-10 rounded-full border-4 border-landing-button-primary dark:border-dark-accent border-t-transparent animate-spin" />
								<p className="text-sm">Preparing your experience…</p>
							</div>
						) : (
							<>
								{session.data.session.state === "major_category_choice" && (
									<div className="space-y-4">
										<div>
											<h2 className="text-xl font-bold text-gray-900/90 dark:text-dark-text">
												What do you want to learn?
											</h2>
											<p className="text-sm text-gray-500 dark:text-dark-muted mt-1 font-montserrat">
												Pick the area that interests you most.
											</p>
										</div>
										<div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-dark-border [&::-webkit-scrollbar-thumb]:rounded-full">
											{majorCategories.data?.categories.map((cat, idx) => (
												<button
													key={cat}
													type="button"
													onClick={() =>
														action({
															action: {
																type: "major_category_choice",
																category: idx,
															},
														})
													}
													className="group flex items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-dark-surface hover:bg-landing-button-primary dark:hover:bg-dark-accent hover:text-white border border-gray-200 dark:border-dark-border hover:border-landing-button-primary dark:hover:border-dark-accent transition-all text-left font-montserrat"
												>
													<span className="text-sm font-medium text-gray-700 dark:text-dark-muted group-hover:text-white">
														{cat}
													</span>
												</button>
											))}
										</div>
									</div>
								)}

								{session.data.session.state === "learning_intent_freetext" && (
									<div className="space-y-4">
										<div>
											<h2 className="text-xl font-bold text-gray-900/90 dark:text-dark-text">
												Why do you want to learn this?
											</h2>
											<p className="text-sm text-gray-500 dark:text-dark-muted mt-1 font-montserrat">
												Tell us your goal so we can tailor your course.
											</p>
										</div>
										<div className="bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-4">
											<textarea
												placeholder="I want to learn this because..."
												className="w-full bg-transparent focus:outline-none text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted font-montserrat"
												value={learningIntent}
												onChange={(e) => setLearningIntent(e.target.value)}
											/>
										</div>
										<button
											type="button"
											disabled={!learningIntent.trim()}
											onClick={() =>
												action({
													action: {
														type: "learning_intent_freetext",
														intent: learningIntent,
													},
												})
											}
											className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-landing-button-primary dark:bg-dark-accent text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-montserrat"
										>
											Continue
											<Icon name="arrow-right" size={18} />
										</button>
										<button
											type="button"
											onClick={() => resetSession.mutate()}
											className="w-full py-2 px-4 rounded-lg font-medium border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-surface flex items-center justify-center gap-2 font-montserrat"
										>
											<Icon name="arrow-left" size={16} />
											Start Over
										</button>
									</div>
								)}

								{session.data.session.state === "answer_question" && (
									<div className="space-y-5">
										<div>
											<p className="text-xs font-semibold text-landing-button-primary dark:text-dark-accent uppercase tracking-wide mb-1 font-montserrat">
												Question
											</p>
											<h2 className="text-xl font-bold leading-snug text-gray-900/90 dark:text-dark-text">
												{currentQuestion?.text}
											</h2>
										</div>

										{currentQuestion?.type === "mcq" && (
											<div className="space-y-2  max-h-[40vh] overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:bg-dark-surface [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-dark-border [&::-webkit-scrollbar-thumb]:rounded-full">
												{currentQuestion.options.map((option) => (
													<button
														key={option}
														type="button"
														onClick={() =>
															action({
																action: {
																	type: "answer_question",
																	questionKey: currentQuestion.key,
																	answer: option,
																},
															})
														}
														className="group w-full flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-dark-surface hover:bg-landing-button-primary dark:hover:bg-dark-accent hover:text-white border border-gray-200 dark:border-dark-border hover:border-landing-button-primary dark:hover:border-dark-accent transition-all text-left font-montserrat"
													>
														<div className="w-5 h-5 rounded-full border-2 border-gray-400 dark:border-dark-muted group-hover:border-white shrink-0 transition-colors" />
														<span className="text-sm font-medium text-gray-700 dark:text-dark-muted group-hover:text-white">
															{option}
														</span>
													</button>
												))}
											</div>
										)}

										{currentQuestion?.type === "yes_no" && (
											<div className="grid grid-cols-2 gap-3">
												<button
													type="button"
													onClick={() =>
														action({
															action: {
																type: "answer_question",
																questionKey: currentQuestion.key,
																answer: "yes",
															},
														})
													}
													className="py-3 px-4 rounded-lg font-medium bg-green-500/80 text-white flex items-center justify-center gap-2 font-montserrat"
												>
													<Icon name="check" size={18} />
													Yes
												</button>
												<button
													type="button"
													onClick={() =>
														action({
															action: {
																type: "answer_question",
																questionKey: currentQuestion.key,
																answer: "no",
															},
														})
													}
													className="py-3 px-4 rounded-lg font-medium bg-red-500/90 text-white flex items-center justify-center gap-2 font-montserrat"
												>
													<Icon name="x" size={18} />
													No
												</button>
											</div>
										)}

										<button
											type="button"
											onClick={() => resetSession.mutate()}
											className="w-full py-2 px-4 rounded-lg font-medium border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-surface flex items-center justify-center gap-2 font-montserrat"
										>
											<Icon name="arrow-left" size={16} />
											Start Over
										</button>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

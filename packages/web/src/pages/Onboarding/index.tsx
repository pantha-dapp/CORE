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
import Button from "../../shared/components/Button";
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
		<div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-12">
			<div className="w-full max-w-xl space-y-8">
				{/* Logo / Brand */}
				<div className="text-center space-y-1">
					<h1 className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
						Pantha
					</h1>
					<p className="text-gray-400 text-sm">
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
										? "bg-green-500"
										: i === stepIndex
											? "bg-blue-500 ring-4 ring-blue-500/30"
											: "bg-gray-700"
								}`}
							>
								{i < stepIndex ? (
									<Icon name="check" size={16} className="text-white" />
								) : (
									<Icon name={step.icon} size={16} className="text-white" />
								)}
							</div>
							<span
								className={`text-xs font-medium ${
									i <= stepIndex ? "text-white" : "text-gray-500"
								}`}
							>
								{step.label}
							</span>
							{/* connector line */}
							{i < steps.length - 1 && <div className={`absolute hidden`} />}
						</div>
					))}
				</div>

				{/* Main card */}
				<div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5">
					{/* Loading / pending */}
					{!session.data || jobState?.data?.state === "pending" ? (
						<div className="flex flex-col items-center gap-3 py-8 text-gray-400">
							<div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
							<p className="text-sm">Preparing your experience…</p>
						</div>
					) : (
						<>
							{/* ── Step 1: Major category choice ── */}
							{session.data.session.state === "major_category_choice" && (
								<div className="space-y-4">
									<div>
										<h2 className="text-xl font-bold">
											What do you want to learn?
										</h2>
										<p className="text-sm text-gray-400 mt-1">
											Pick the area that interests you most.
										</p>
									</div>
									<div className="grid grid-cols-2 gap-3">
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
												className="group flex items-center gap-2 p-4 rounded-xl bg-gray-800 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 transition-all duration-200 text-left"
											>
												<span className="text-sm font-medium text-gray-200 group-hover:text-white">
													{cat}
												</span>
											</button>
										))}
									</div>
								</div>
							)}

							{/* ── Step 2: Learning intent ── */}
							{session.data.session.state === "learning_intent_freetext" && (
								<div className="space-y-4">
									<div>
										<h2 className="text-xl font-bold">
											Why do you want to learn this?
										</h2>
										<p className="text-sm text-gray-400 mt-1">
											Tell us your goal so we can tailor your course.
										</p>
									</div>
									<div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 italic">
										<input
											type="text"
											placeholder="I want to learn this because..."
											className="w-full bg-transparent focus:outline-none"
											value={learningIntent}
											onChange={(e) => setLearningIntent(e.target.value)}
										/>
									</div>
									<Button
										type="button"
										variant="primary"
										size="md"
										fullWidth
										icon="arrow-right"
										iconPosition="right"
										disabled={!learningIntent.trim()}
										onClick={() =>
											action({
												action: {
													type: "learning_intent_freetext",
													intent: learningIntent,
												},
											})
										}
									>
										Continue
									</Button>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										fullWidth
										icon="arrow-left"
										iconPosition="left"
										onClick={() => resetSession.mutate()}
									>
										Start Over
									</Button>
								</div>
							)}

							{/* ── Step 3: Answer questions ── */}
							{session.data.session.state === "answer_question" && (
								<div className="space-y-5">
									<div>
										<p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">
											Question
										</p>
										<h2 className="text-xl font-bold leading-snug">
											{currentQuestion?.text}
										</h2>
									</div>

									{/* MCQ options */}
									{currentQuestion?.type === "mcq" && (
										<div className="space-y-2">
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
													className="group w-full flex items-center gap-3 p-4 rounded-xl bg-gray-800 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 transition-all duration-200 text-left"
												>
													<div className="w-5 h-5 rounded-full border-2 border-gray-500 group-hover:border-white shrink-0 transition-colors" />
													<span className="text-sm font-medium text-gray-200 group-hover:text-white">
														{option}
													</span>
												</button>
											))}
										</div>
									)}

									{/* Yes / No options */}
									{currentQuestion?.type === "yes_no" && (
										<div className="grid grid-cols-2 gap-3">
											<Button
												type="button"
												variant="success"
												size="md"
												icon="check"
												onClick={() =>
													action({
														action: {
															type: "answer_question",
															questionKey: currentQuestion.key,
															answer: "yes",
														},
													})
												}
											>
												Yes
											</Button>
											<Button
												type="button"
												variant="danger"
												size="md"
												icon="x"
												onClick={() =>
													action({
														action: {
															type: "answer_question",
															questionKey: currentQuestion.key,
															answer: "no",
														},
													})
												}
											>
												No
											</Button>
										</div>
									)}

									<Button
										type="button"
										variant="secondary"
										size="sm"
										fullWidth
										icon="arrow-left"
										iconPosition="left"
										onClick={() => resetSession.mutate()}
									>
										Start Over
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

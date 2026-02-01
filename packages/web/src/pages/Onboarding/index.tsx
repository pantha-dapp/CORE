import {
	useCourseGenerationAction,
	useCourseGenerationMajorCategories,
	useCourseGenerationSession,
	useEnrolledCourses,
	useJobStatus,
} from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
// import { useState } from "react";

export default function Onboarding() {
	const session = useCourseGenerationSession();
	const { data: actionData, mutate: action } = useCourseGenerationAction();
	const jobState = useJobStatus({ jobId: actionData?.awaitedJobId });
	const majorCategories = useCourseGenerationMajorCategories();
	const router = useRouter();
	const enrolledCourses = useEnrolledCourses();
	const currentQuestion = useMemo(
		() => session.data?.session.questions.find((q) => !q.answer),
		[session.data],
	);

	useEffect(() => {
		if (enrolledCourses.data && session.data?.session.state === "finished") {
			router.navigate({ to: "/dashboard" });
		}
	}, [enrolledCourses.data, router, session.data?.session.state]);

	return (
		<div>
			<textarea
				rows={20}
				className="resize-none text-sm p-5 w-full"
				defaultValue={JSON.stringify(session.data, null, 2)}
			/>
			<button type="button" onClick={() => session.refetch()}>
				Refresh Session
			</button>
			<textarea
				rows={3}
				className="resize-none text-sm p-5 w-full"
				defaultValue={JSON.stringify(jobState.data, null, 2)}
			/>

			{session.data &&
				(jobState?.data?.state === "pending" ? (
					"Loading wait"
				) : (
					<div className="flex flex-col gap-y-3">
						{session.data.session.state === "major_category_choice" &&
							majorCategories.data?.categories.map((cat, idx) => (
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
								>
									{cat}
								</button>
							))}

						{session.data.session.state === "learning_intent_freetext" && (
							<div className="flex flex-col gap-y-3">
								<p>intent </p>
								<button
									type="button"
									onClick={() =>
										action({
											action: {
												type: "learning_intent_freetext",
												intent: "I want to learn about this just for fun!",
											},
										})
									}
								>
									submit a cool intent
								</button>
							</div>
						)}
						{/* // here i will retirve questions one by one and then answer them  */}

						{session.data.session.state === "answer_question" && (
							<div className="flex flex-col gap-y-3">
								{currentQuestion?.text}

								{currentQuestion?.type === "mcq" &&
									currentQuestion.options.map((option) => (
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
										>
											{option}
										</button>
									))}

								{currentQuestion?.type === "yes_no" && (
									<div className="flex gap-x-3">
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
										>
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
										>
											No
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				))}
		</div>
	);
}

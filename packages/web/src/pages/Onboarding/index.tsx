import {
	useCourseGenerationAction,
	useCourseGenerationMajorCategories,
	useCourseGenerationSession,
} from "@pantha/react/hooks";

export default function Onboarding() {
	const session = useCourseGenerationSession();
	const { data: jobState, mutate: action } = useCourseGenerationAction();
	const majorCategories = useCourseGenerationMajorCategories();

	return (
		<div>
			<textarea
				rows={20}
				className="resize-none text-sm p-5 w-full"
				defaultValue={JSON.stringify(session.data, null, 2)}
			/>
			<textarea
				rows={5}
				className="resize-none text-sm p-5 w-full"
				defaultValue={JSON.stringify({ jobState }, null, 2)}
			/>

			{session.data &&
				(jobState?.state === "pending" ? (
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
					</div>
				))}
		</div>
	);
}

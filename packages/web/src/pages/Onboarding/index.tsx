import {
	useCourseGenerationAction,
	useCourseGenerationMajorCategories,
	useCourseGenerationSession,
} from "@pantha/react/hooks";

export function Onboarding() {
	const session = useCourseGenerationSession();
	const action = useCourseGenerationAction();
	const majorCategories = useCourseGenerationMajorCategories();

	return (
		<div>
			<textarea
				rows={20}
				className="resize-none text-sm"
				defaultValue={JSON.stringify(session.data, null, 2)}
			/>
		</div>
	);
}

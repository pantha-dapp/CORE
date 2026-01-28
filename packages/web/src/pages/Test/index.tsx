import {
	useCourseGenerationAction,
	useCourseGenerationSession,
} from "@pantha/react/hooks";

export default function () {
	const session = useCourseGenerationSession();
	const action = useCourseGenerationAction();

	return (
		<div className="p-8">
			{action.isPending ? (
				<div>Loading...</div>
			) : (
				<div>{JSON.stringify(session.data)}</div>
			)}
		</div>
	);
}

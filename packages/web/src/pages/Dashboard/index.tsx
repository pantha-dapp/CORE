import { useCourseById, useEnrolledCourses } from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import Button from "../../shared/components/Button";

// Component to display individual enrollment details and handle navigation because it was not happening properly in the main Dashboard component

function EnrollmentCard({
	enrollment,
}: {
	enrollment: { courseId: string; progress: number };
}) {
	const router = useRouter();
	const courseDetails = useCourseById({ id: enrollment.courseId });

	function handleCourseClick(courseId: string) {
		router.navigate({ to: `/chapters/${courseId}` });
	}

	return (
		<li className="p-4 bg-gray-800 rounded-lg shadow-md flex justify-between items-center">
			<div>
				<h2 className="text-xl font-semibold">
					{courseDetails.data?.title || "Loading..."}
				</h2>
				{courseDetails.data?.description && (
					<p className="text-gray-300 text-sm mt-1">
						{courseDetails.data.description}
					</p>
				)}
				<p className="text-gray-400 mt-2">Progress: {enrollment.progress}</p>
			</div>
			<div>
				<Button
					onClick={() => handleCourseClick(enrollment.courseId)}
					className="bg-blue-600 hover:bg-blue-700"
				>
					View Course
				</Button>
			</div>
		</li>
	);
}

export default function Dashboard() {
	const enrolledCourses = useEnrolledCourses();
	const router = useRouter();

	useEffect(() => {
		if (
			enrolledCourses.data !== undefined &&
			enrolledCourses.data.enrollments.length === 0
		) {
			router.navigate({ to: "/onboarding" });
		}
	}, [enrolledCourses.data, router]);

	if (enrolledCourses.isLoading) {
		return <div>Loading your courses...</div>;
	}

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8 pb-24">
			<h1 className="text-3xl font-bold mb-6">Your Courses</h1>
			{enrolledCourses.data && enrolledCourses.data.enrollments.length === 0 ? (
				<div>
					<p className="mb-4">You are not enrolled in any courses yet.</p>
				</div>
			) : (
				<div>
					<ul className="space-y-4">
						{enrolledCourses.data?.enrollments.map((enrollment) => (
							<EnrollmentCard
								key={enrollment.courseId}
								enrollment={enrollment}
							/>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

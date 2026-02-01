import { useCourseById, useEnrolledCourses } from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import type { JSX } from "react/jsx-runtime";
import Button from "../../shared/components/Button";
export default function Dashboard() {
	const enrolledCourses = useEnrolledCourses();
	const router = useRouter();
	const courseDetails = useCourseById({
		id: enrolledCourses.data?.enrollments[0]?.courseId ?? "",
	}); // Example to show usage of useCourseById
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
						{enrolledCourses.data?.enrollments.map(
							(enrollment): JSX.Element => (
								<li
									key={enrollment.courseId}
									className="p-4 bg-gray-800 rounded-lg shadow-md flex justify-between items-center"
								>
									<div>
										<h2 className="text-xl font-semibold">
											course details:{" "}
											{courseDetails.data?.title || "Loading..."}
										</h2>
										<p className="text-gray-400">
											description:{" "}
											{courseDetails.data?.description || "Loading..."}
										</p>
									</div>
								</li>
							),
						)}
					</ul>
				</div>
			)}
		</div>
	);
}

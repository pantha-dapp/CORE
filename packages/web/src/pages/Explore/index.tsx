import { usePanthaContext } from "@pantha/react";
import {
	useCourseById,
	useCourseExploration,
	useEnrollForCourse,
	useUserCourses,
} from "@pantha/react/hooks";
import { useEffect, useState } from "react";
import PageHeader from "../../shared/components/PageHeader";

interface CourseDetails {
	[key: string]: string;
}

export default function Explore() {
	const { wallet } = usePanthaContext();
	const walletAddress = wallet?.account.address;

	const userCoursesQuery = useUserCourses({
		walletAddress,
	});

	const courseExplorationQuery = useCourseExploration({
		id: "explore",
	});

	console.log("Course Exploration Data:", courseExplorationQuery.data);

	const enrollForCourseMutation = useEnrollForCourse();
	const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

	const selectedCourseQuery = useCourseById({
		id: selectedCourseId || undefined,
	});

	const [courseDetailsMap, setCourseDetailsMap] = useState<CourseDetails>({});

	useEffect(() => {
		const detailsMap: CourseDetails = {};

		// For suggestions, they already have title property
		if (courseExplorationQuery.data?.suggestions) {
			courseExplorationQuery.data.suggestions.forEach((c) => {
				detailsMap[c.id] = c.title || "Untitled";
			});
		}

		setCourseDetailsMap(detailsMap);

		// Fetch titles for enrolled courses if needed
		if (
			userCoursesQuery.data?.courses &&
			userCoursesQuery.data.courses.length > 0
		) {
			const fetchEnrolledTitles = async () => {
				const updatedMap = { ...detailsMap };

				for (const course of userCoursesQuery.data.courses || []) {
					try {
						const res = await fetch(`/api/courses/${course.courseId}`);
						if (res.ok) {
							const data = (await res.json()) as { data: { title: string } };
							updatedMap[course.courseId] = data.data.title;
						}
					} catch (error) {
						console.error(`Failed to fetch course ${course.courseId}:`, error);
					}
				}

				setCourseDetailsMap(updatedMap);
			};

			fetchEnrolledTitles();
		}
	}, [
		userCoursesQuery.data?.courses,
		courseExplorationQuery.data?.suggestions,
	]);

	const handleEnroll = async (courseId: string) => {
		try {
			await enrollForCourseMutation.mutateAsync({ courseId });
			await userCoursesQuery.refetch();
		} catch (e) {
			console.error("Failed to enroll:", e);
		}
	};

	return (
		<div className="dark pt-6 min-h-screen bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg text-dark-text px-4 pb-24">
			<div className="max-w-6xl mx-auto">
				<PageHeader
					badge="Discovery"
					title="Explore"
					subtitle="Discover new courses, events, and shop items here!"
				/>

				{!walletAddress ? (
					<div className="text-center py-16">
						<p className="text-dark-muted text-lg font-montserrat">
							Connect your wallet to explore courses
						</p>
					</div>
				) : (
					<div className="space-y-8">
						{/* User's Enrolled Courses */}
						{userCoursesQuery.data?.courses &&
							userCoursesQuery.data.courses.length > 0 && (
								<div className="space-y-4">
									<h2 className="text-2xl font-bold text-dark-text font-titillium">
										Your Courses
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{userCoursesQuery.data.courses.map((course) => (
											<button
												key={course.courseId}
												type="button"
												className="rounded-xl bg-dark-surface border border-dark-border/50 p-4 hover:border-dark-accent transition-colors text-left"
												onClick={() => setSelectedCourseId(course.courseId)}
											>
												<h3 className="font-semibold text-dark-text font-titillium truncate">
													{courseDetailsMap[course.courseId] || "Loading..."}
												</h3>
												<p className="text-sm text-dark-muted mt-2">
													Progress: {course.progress}%
												</p>
											</button>
										))}
									</div>
								</div>
							)}

						{/* Similar/Suggested Courses */}
						{courseExplorationQuery.data?.suggestions &&
							courseExplorationQuery.data.suggestions.length > 0 && (
								<div className="space-y-4">
									<h2 className="text-2xl font-bold text-dark-text font-titillium">
										Recommended Courses
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{courseExplorationQuery.data.suggestions.map((course) => (
											<button
												key={course.id}
												type="button"
												className="rounded-xl bg-dark-surface border border-dark-border/50 p-4 hover:border-dark-accent transition-colors text-left"
												onClick={() => setSelectedCourseId(course.id)}
											>
												<h3 className="font-semibold text-dark-text font-titillium mb-2 truncate">
													{course.title || "Untitled"}
												</h3>
												<p className="text-sm text-dark-muted text-xs line-clamp-2">
													{course.description || "No description"}
												</p>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleEnroll(course.id);
													}}
													disabled={enrollForCourseMutation.isPending}
													className="mt-3 w-full rounded-lg bg-dark-accent px-3 py-2 text-sm font-semibold text-dark-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
												>
													{enrollForCourseMutation.isPending
														? "Enrolling..."
														: "Enroll"}
												</button>
											</button>
										))}
									</div>
								</div>
							)}
						{/* Course Details Modal */}
						{selectedCourseId && selectedCourseQuery.data && (
							<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
								<div className="bg-dark-surface rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-dark-border">
									<div className="flex items-start justify-between mb-4">
										<h2 className="text-2xl font-bold text-dark-text font-titillium">
											{selectedCourseQuery.data.title}
										</h2>
										<button
											type="button"
											onClick={() => setSelectedCourseId(null)}
											className="text-dark-muted hover:text-dark-text"
										>
											✕
										</button>
									</div>

									<div className="space-y-4">
										<div>
											<h3 className="font-semibold text-dark-text mb-2">
												Description
											</h3>
											<p className="text-dark-muted text-sm leading-relaxed">
												{selectedCourseQuery.data.description}
											</p>
										</div>

										<button
											type="button"
											onClick={() => handleEnroll(selectedCourseId)}
											disabled={enrollForCourseMutation.isPending}
											className="w-full mt-6 rounded-lg bg-dark-accent px-4 py-3 font-semibold text-dark-bg hover:opacity-90 disabled:opacity-50 transition-opacity"
										>
											{enrollForCourseMutation.isPending
												? "Enrolling..."
												: "Enroll in Course"}
										</button>
									</div>
								</div>
							</div>
						)}

						{/* Loading States */}
						{(userCoursesQuery.isLoading ||
							courseExplorationQuery.isLoading) && (
							<div className="text-center py-12">
								<p className="text-dark-muted">Loading courses...</p>
							</div>
						)}

						{/* Empty State */}
						{!userCoursesQuery.isLoading &&
							!courseExplorationQuery.isLoading &&
							(!userCoursesQuery.data?.courses ||
								userCoursesQuery.data.courses.length === 0) &&
							(!courseExplorationQuery.data?.suggestions ||
								courseExplorationQuery.data.suggestions.length === 0) && (
								<div className="text-center py-16">
									<p className="text-dark-muted text-lg font-montserrat">
										No courses available yet. Start by enrolling in a course!
									</p>
								</div>
							)}
					</div>
				)}
			</div>
		</div>
	);
}

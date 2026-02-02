import {
	useCourseById,
	useCourseChaptersByCourseId,
} from "@pantha/react/hooks";
import { useParams, useRouter } from "@tanstack/react-router";
import Button from "../../shared/components/Button";

export default function Chapters() {
	const { courseId } = useParams({ strict: false });
	const router = useRouter();

	const courseDetails = useCourseById({ id: courseId ?? "" });
	const courseChapters = useCourseChaptersByCourseId({
		courseId: courseId ?? "",
	});

	if (courseDetails.isLoading || courseChapters.isLoading) {
		return (
			<div className="min-h-screen bg-gray-900 text-white px-6 py-8">
				Loading course details...
			</div>
		);
	}

	if (!courseDetails.data || !courseChapters.data) {
		return (
			<div className="min-h-screen bg-gray-900 text-white px-6 py-8">
				Course not found
			</div>
		);
	}

	function handleChapterClick(chapterId: string) {
		router.navigate({ to: `/course/${courseId}/chapter/${chapterId}` });
	}

	function handleBackClick() {
		router.navigate({ to: "/dashboard" });
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white px-6 py-8 pb-24">
			<Button onClick={handleBackClick} className="mb-4">
				← Back to Dashboard
			</Button>

			<h1 className="text-3xl font-bold mb-2">{courseDetails.data.title}</h1>
			<p className="text-gray-400 mb-6">{courseDetails.data.description}</p>

			<h2 className="text-2xl font-semibold mb-4">Chapters</h2>

			{courseChapters.data.chapters.length === 0 ? (
				<p className="text-gray-400">No chapters available yet.</p>
			) : (
				<ul className="space-y-3">
					{courseChapters.data.chapters.map((chapter) => (
						<li
							key={chapter.id}
							className="p-4 bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 transition-colors"
						>
							<Button
								onClick={() => handleChapterClick(chapter.id)}
								variant="secondary"
								className="w-full text-left"
							>
								<div className="flex justify-between items-center">
									<div>
										<h3 className="text-xl font-semibold text-gray-900">
											{chapter.title}
										</h3>
										{chapter.description && (
											<p className="text-sm text-white mt-1">
												{chapter.description}
											</p>
										)}
									</div>
									<span className="text-gray-400">→</span>
								</div>
							</Button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

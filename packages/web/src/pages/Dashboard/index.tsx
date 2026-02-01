import { useEnrolledCourses } from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import type { JSX } from "react/jsx-runtime";
import Button from "../../shared/components/Button";

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
			<div className="max-w-6xl mx-auto space-y-10">
				{/* ================= Top Summary ================= */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<SummaryCard title="Day Streak 🔥" value="18 days" />
					<SummaryCard title="Daily XP" value="320 / 500" />
					<SummaryCard title="Total XP" value="12,450" />
					<SummaryCard title="League" value="Emerald" />
				</div>

				{/* ================= Continue Learning ================= */}
				<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-6 rounded-2xl">
					<h2 className="text-xl font-bold mb-4">Continue Learning</h2>

					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<div>
							<p className="text-lg font-semibold">French</p>
							<p className="text-white/60 text-sm">Unit 6 • Ordering food</p>
						</div>

						<Button variant="outline">Continue</Button>
					</div>
				</div>

				{/* ================= Your Courses ================= */}
				<section className="space-y-4">
					<h2 className="text-xl font-bold">Your Courses</h2>

					<div className="grid md:grid-cols-2 gap-4">
						<CourseCard
							language="French"
							level="Intermediate"
							progress={72}
							xp="8,200 XP"
						/>
						<CourseCard
							language="Spanish"
							level="Beginner"
							progress={38}
							xp="2,900 XP"
						/>
						<CourseCard
							language="German"
							level="Beginner"
							progress={21}
							xp="1,350 XP"
						/>
					</div>
				</section>

				{/* ================= Daily Challenge ================= */}
				<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-6 rounded-2xl">
					<h2 className="text-xl font-bold mb-2">Daily Challenge ⚡</h2>
					<p className="text-white/60 mb-4">
						Complete 3 lessons without mistakes
					</p>
					<Button variant="primary">Start Challenge</Button>
				</div>

				{/* ================= Recent Activity ================= */}
				<section className="space-y-3">
					<h2 className="text-xl font-bold">Recent Activity</h2>

					<ActivityItem text="Completed a French lesson (+40 XP)" />
					<ActivityItem text="Maintained 18 day streak 🔥" />
					<ActivityItem text="Moved up to Emerald League" />
				</section>
			</div>
		</div>
	);
}

/* ================= Components ================= */

interface SummaryCardProps {
	title: string;
	value: string;
}

function SummaryCard({ title, value }: SummaryCardProps): JSX.Element {
	return (
		<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-4 rounded-xl text-center">
			<p className="text-sm text-white/60">{title}</p>
			<p className="text-xl font-bold mt-1">{value}</p>
		</div>
	);
}

interface CourseCardProps {
	language: string;
	level: string;
	progress: number;
	xp: string;
}

function CourseCard({
	language,
	level,
	progress,
	xp,
}: CourseCardProps): JSX.Element {
	return (
		<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-5 rounded-xl space-y-3">
			<div className="flex justify-between">
				<div>
					<p className="font-semibold">{language}</p>
					<p className="text-sm text-white/60">{level}</p>
				</div>
				<p className="text-primary font-bold">{xp}</p>
			</div>

			{/* Progress Bar */}
			<div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
				<div
					className="bg-primary h-2 rounded-full"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<p className="text-xs text-white/60">{progress}% completed</p>
		</div>
	);
}

interface ActivityItemProps {
	text: string;
}

function ActivityItem({ text }: ActivityItemProps): JSX.Element {
	return (
		<div className="bg-linear-to-b from-gray-900 to-gray-800 border border-borderApp p-4 rounded-xl text-white/80">
			{text}
		</div>
	);
}

export function generateCanonicalCourseDescriptor(course: {
	name: string;
	description: string;
	topics: string[];
}) {
	return `
Course: ${course.name}
Description: ${course.description}
Concepts: ${course.topics.join(", ")}
	`;
}

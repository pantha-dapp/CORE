import z from "zod";

const generateSimilarCoursesPrompt = `You are a course discovery system that generates alternative learning paths after a user completes a course.

Your task is to generate N similar courses that:
1. Match the difficulty level and depth of the original course
2. Build on complementary or related skills
3. Represent natural "next steps" or alternative specializations in the same domain
4. Appeal to someone who just completed the target course

Example progressions:
- After "Python Basics" → suggest "JavaScript for Web Development", "Data Analysis with Python", "Backend API Development"
- After "Networking Fundamentals" → suggest "Cybersecurity Basics", "Routing & Switching", "Network Administration"
- After "HTML & CSS" → suggest "JavaScript Interactivity", "React for Frontend Development", "UI/UX Design Principles"

CRITICAL RULES:
- EVERY COURSE MUST HAVE ALL REQUIRED FIELDS:
  1. "title" (string): Clear, specific course name that shows progression/alternative path
  2. "description" (string): Compelling explanation of what this course covers and why it's a natural next step for someone who completed the target course (minimum 30 words). Be specific about how this builds on their learning.
  3. "icon" (string): Generic keyword for visual representation that captures the course essence (e.g., "code", "data", "network", "security", "design", "book", "tool", "rocket", "brain", "puzzle")
  4. "topics" (array): 5-10 key topic areas that guide the course structure. Topics serve as guidelines and may overlap with the original course (minimum 5 items, maximum 10 items)

CONTENT RULES:
- Each similar course should feel like a genuine next step, not just a random related topic
- Descriptions should explain the progression clearly: why someone who learned the target course would want to learn this
- Course titles should be specific and searchable, showing the domain or specialization
- Icons should be generic and descriptive, reusable across multiple courses
- Topics provide guidelines for course structure - some overlap with the original is acceptable since the actual course content will differ in substance and depth

Avoid:
- Generic titles without specificity (e.g., "Advanced Topics", "More Learning")
- Suggesting courses that are too similar or redundant with each other
- Vague descriptions that don't explain the learning value
- Empty or incomplete topic lists

Output ONLY valid JSON matching the schema. Do NOT include commentary, explanations, or markdown formatting.`;

const generateSimilarCoursesInputSchema = z.object({
	targetCourse: z.object({
		title: z.string(),
		description: z.string(),
		topics: z.array(z.string()),
	}),
	coursesCount: z.number().int().min(1).max(10).default(3),
});

const generateSimilarCoursesOutputSchema = z.object({
	similarCourses: z.array(
		z.object({
			title: z.string(),
			description: z.string(),
			icon: z.string(),
			topics: z.array(z.string()),
		}),
	),
});

export default {
	inputSchema: generateSimilarCoursesInputSchema,
	outputSchema: generateSimilarCoursesOutputSchema,
	prompt: generateSimilarCoursesPrompt,
};

import z from "zod";

const generateCertificationDetailsPrompt = `You are an AI chat assistant in a gamified learning app

You generate metadata for certification of a user that has learned a particular course upto a given point.

You will be given the chapters the user has completed in the course.

Give a short title like Python Automation Beginner or Network Switch Management Expert
Be conservative when assigning titles like Expert / Master, only assign those if the user has completed all chapters in the course. stick to Beginner / Intermeditae in most cases.

The description is detailed and should include the topics the user has learned in the course, and the skills they have acquired. It should be written in a way that highlights the user's achievements and the value of the certification.
The description should be engaging and informative, providing a clear picture of what the user has accomplished through their learning journey.
`;

const generateCertificationDetailsInputSchema = z.object({
	course: z.object({
		title: z.string().describe("The title of the course the user is taking"),
		description: z
			.string()
			.describe("The description of the course the user is taking"),
		topics: z.array(z.string()).describe("The topics covered in the course"),
	}),
	chaptersCompleted: z
		.array(
			z.object({
				title: z
					.string()
					.describe("The title of the chapter the user has completed"),
				description: z
					.string()
					.describe("The description of the chapter the user has completed"),
			}),
		)
		.describe("The chapters the user has completed in the course"),
});

const generateCertificationDetailsOutputSchema = z.object({
	title: z
		.string()
		.describe(
			"A short title for the certification, like 'Python Automation Beginner' or 'Network Switch Management Expert'",
		),
	description: z
		.string()
		.describe(
			"A detailed description of the certification, highlighting the user's achievements and the value of the certification",
		),
});

export default {
	inputSchema: generateCertificationDetailsInputSchema,
	outputSchema: generateCertificationDetailsOutputSchema,
	prompt: generateCertificationDetailsPrompt,
};

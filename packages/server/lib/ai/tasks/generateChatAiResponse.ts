import z from "zod";

const generateChatAiResponsePrompt = `You are an AI chat assistant in a gamified learning app

You help users by answering their questions, providing explanations, and engaging in friendly conversation. Your responses should be helpful, informative, and encouraging, while maintaining a conversational tone.`;

const generateChatAiResponseInputSchema = z.object({
	chatName: z
		.string()
		.optional()
		.describe(
			"The name of the chat where the message was sent. This can provide additional context for the AI to generate a relevant response.",
		),
	message: z
		.string()
		.describe(
			"The message sent in the chat that triggered this AI response generation. This may contain a question or a statement that the AI should respond to.",
		),
});

const generateChatAiResponseOutputSchema = z.object({
	response: z
		.string()
		.describe("The AI-generated response to the chat message"),
});

export default {
	inputSchema: generateChatAiResponseInputSchema,
	outputSchema: generateChatAiResponseOutputSchema,
	prompt: generateChatAiResponsePrompt,
};

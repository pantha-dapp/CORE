import { chat } from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";
import { type ZodObject, z } from "zod";
import env from "../../env";

const aiAdapter = createOpenaiChat(
    //@ts-expect-error
    "openai/gpt-oss-120b",
    env.GROQ_API_KEY,
    {
        baseURL: "https://api.groq.com/openai/v1",
    },
);

export function createAiGenerateFunction<
    T extends ZodObject,
    R extends ZodObject,
>(
    schemas: {
        input: T;
        output: R;
    },
    sysmtemPrompt: string,
) {
    async function aiGenerate(input: z.infer<T>, prompt?: string) {
        schemas.input.parse(input);

        const response = await chat({
            adapter: aiAdapter,
            stream: false,
            messages: prompt
                ? [{ role: "user", content: prompt }]
                : [{ role: "user", content: JSON.stringify(input) }],
            systemPrompts: [sysmtemPrompt ?? ""],
            outputSchema: schemas.output,
        });

        return schemas.output.parse(response);
    }

    return aiGenerate;
}

export async function generateEmbeddings(
    input: string | Record<string, unknown>,
) {
    const payload = await fetch(`${env.OLLAMA_HOST}/v1/embeddings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "embeddinggemma:300m",
            input: input,
        }),
    });

    const data = await payload.json();

    const parsed = z
        .object({
            data: z.array(
                z.object({
                    object: z.string(),
                    embedding: z.array(z.number()),
                    index: z.number(),
                }),
            ),
        })
        .parse(data);

    const embedding = parsed.data.find(
        (i) => i.object === "embedding",
    )?.embedding;

    if (!embedding) {
        throw new Error("Failed to generate embedding");
    }

    return embedding;
}

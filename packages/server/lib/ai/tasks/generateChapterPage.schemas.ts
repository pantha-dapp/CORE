import z from "zod";

export const zChapterPageType = z.enum([
	"example_uses",
	"quiz",
	"teach_and_explain_content",
	"true_false",
	"fill_in_the_blanks",
	"identify_shown_object_in_image",
	"matching",
	"identify_object_from_images",
]);

export type ChapterPageType = z.infer<typeof zChapterPageType>;

const imageSchema = z.object({ prompt: z.string() }).optional();
export const pageContentSchemas = {
	example_uses: z.object({
		topic: z.string(),
		text: z.string(),
		examples: z.array(z.string()),
		image: imageSchema,
	}),
	quiz: z.object({
		question: z.string(),
		options: z.array(z.string()),
		correctOptionIndex: z.number(),
		image: imageSchema,
	}),
	teach_and_explain_content: z.object({
		topic: z.string(),
		markdown: z.string(),
		image: imageSchema,
	}),
	true_false: z.object({
		statement: z.string(),
		isTrue: z.boolean(),
		image: imageSchema,
	}),
	fill_in_the_blanks: z.object({
		words: z.array(z.string()),
		answers: z.array(z.string()),
		wrongOptions: z.array(z.string()),
		image: imageSchema,
	}),
	identify_shown_object_in_image: z.object({
		options: z.array(z.string()),
		correctOptionIndex: z.number(),
		image: imageSchema.nonoptional(),
	}),
	matching: z.object({
		pairs: z.array(
			z.object({
				left: z.string(),
				right: z.string(),
			}),
		),
	}),
	identify_object_from_images: z.object({
		object: z.string(),
		images: z.array(imageSchema.nonoptional()),
		correctImageIndex: z.number(),
	}),
} as const;

export const generateChapterPageOutputFlatSchema = z.object({
	type: zChapterPageType,
	content: z.any(),
});

export const generateChapterPageOutputTypedSchema = z
	.object({
		type: z.literal("example_uses"),
		content: pageContentSchemas.example_uses,
	})
	.or(
		z.object({
			type: z.literal("quiz"),
			content: pageContentSchemas.quiz,
		}),
	)
	.or(
		z.object({
			type: z.literal("teach_and_explain_content"),
			content: pageContentSchemas.teach_and_explain_content,
		}),
	)
	.or(
		z.object({
			type: z.literal("true_false"),
			content: pageContentSchemas.true_false,
		}),
	)
	.or(
		z.object({
			type: z.literal("fill_in_the_blanks"),
			content: pageContentSchemas.fill_in_the_blanks,
		}),
	)
	.or(
		z.object({
			type: z.literal("identify_shown_object_in_image"),
			content: pageContentSchemas.identify_shown_object_in_image,
		}),
	)
	.or(
		z.object({
			type: z.literal("matching"),
			content: pageContentSchemas.matching,
		}),
	)
	.or(
		z.object({
			type: z.literal("identify_object_from_images"),
			content: pageContentSchemas.identify_object_from_images,
		}),
	);

export const generatePageInputSchema = z.object({
	type: zChapterPageType,
	instructions: z.string(),
	chapter: z.object({
		title: z.string(),
		description: z.string(),
		intent: z.string(),
		topics: z.array(z.string()),
	}),
});

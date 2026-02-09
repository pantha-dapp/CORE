// import {
// 	generateChapterPage,
// 	generateChapterPageOutputTypedSchema,
// } from "./generateChapterPage";
// import { generateChapterPagesOverview } from "./generateChapterPagesOverview";

// export async function generateChapterPages(
// 	input: Parameters<typeof generateChapterPagesOverview>[0],
// ) {
// 	const overview = await generateChapterPagesOverview(input);
// 	const pages = await Promise.all(
// 		overview.pages.map(async (page) => {
// 			const content = await generateChapterPage[page.type]({
// 				type: page.type,
// 				instructions: page.instructions,
// 				chapter: input.chapter.overview,
// 			});
// 			return {
// 				type: page.type,
// 				content,
// 			};
// 		}),
// 	);

// 	const parsed = generateChapterPageOutputTypedSchema.array().safeParse(pages);

// 	if (!parsed.success) {
// 		console.error(
// 			"Failed to parse generated pages",
// 			String(parsed.error).slice(0, 200),
// 		);
// 		throw new Error("Failed to parse generated pages");
// 	}

// 	return {
// 		pages: parsed.data,
// 	};
// }

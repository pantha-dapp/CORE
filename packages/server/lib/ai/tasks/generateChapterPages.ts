import { generateChapterPage } from "./generateChapterPage";
import { generateChapterPagesOverview } from "./generateChapterPagesOverview";

export async function generateChapterPages(
	input: Parameters<typeof generateChapterPagesOverview>[0],
) {
	const overview = await generateChapterPagesOverview(input);
	const pages: Awaited<
		ReturnType<(typeof generateChapterPage)[keyof typeof generateChapterPage]>
	>[] = [];
	for (const { type, instructions } of overview.pages) {
		const page = await generateChapterPage[type]({
			type,
			instructions,
			chapter: input.chapter.overview,
		});
		pages.push(page);
	}

	return { pages };
}

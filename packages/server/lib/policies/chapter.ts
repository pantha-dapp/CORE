import { and, eq } from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "../errors";
import type { Enforcers } from ".";

const enforcers: Enforcers<"chapter"> = {
	"chapter.view": async (user, resource, app) => {
		const { db } = app;

		const chapter = await db.chapterById({ chapterId: resource.chapterId });
		if (!chapter) throw new NotFoundError("Chapter not found.");

		const [enrollment] = await db
			.select()
			.from(db.schema.userCourses)
			.where(
				and(
					eq(db.schema.userCourses.userWallet, user),
					eq(db.schema.userCourses.courseId, chapter.courseId),
				),
			);

		if (enrollment) {
			const progress = enrollment.progress ?? 0;
			if (progress < chapter.order) {
				throw new ForbiddenError(
					"You must complete previous chapters before accessing this one.",
				);
			}
		}

		return true;
	},
};

export default enforcers;

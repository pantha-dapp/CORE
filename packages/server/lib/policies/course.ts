import { and, eq } from "drizzle-orm";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../errors";
import type { Enforcers } from ".";

const enforcers: Enforcers<"course"> = {
	"course.certification.request": async (user, resource, app) => {
		const { db } = app;
		const { courseId } = resource;

		const course = await db.courseById({ courseId });

		if (!course) {
			throw new NotFoundError("Course not found.");
		}

		const enrollments = await db.userEnrollments({
			userWallet: user,
		});

		const enrollment = enrollments.find((e) => e.courseId === courseId);

		if (!enrollment) {
			throw new ForbiddenError("You are not enrolled in this course.");
		}

		if (enrollment.progress <= 10) {
			throw new ForbiddenError(
				"You have not made enough progress in the course.",
			);
		}

		const certPurchase = db
			.select()
			.from(db.schema.userPurchases)
			.where(
				and(
					eq(db.schema.userPurchases.userWallet, user),
					eq(db.schema.userPurchases.itemId, "CERTIFCT"),
					eq(db.schema.userPurchases.consumed, 0),
				),
			)
			.get();
		console.log(certPurchase);
		if (!certPurchase) {
			const hasCertificate = db
				.select({ id: db.schema.userCertificates.id })
				.from(db.schema.userCertificates)
				.where(eq(db.schema.userCertificates.userWallet, user))
				.get();

			if (hasCertificate) {
				throw new ForbiddenError(
					"You have already completed the certification process.",
				);
			}

			throw new UnauthorizedError(
				"You need to purchase a Course Certificate from the shop before requesting certification.",
			);
		}

		return true;
	},
};

export default enforcers;

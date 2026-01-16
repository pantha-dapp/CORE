import { zValidator } from "@hono/zod-validator";
import { jsonParse } from "@pantha/shared";
import { respond } from "../../lib/utils/respond";

type Target = Parameters<typeof zValidator>[0];
type Schema = Parameters<typeof zValidator>[1];

export const validator = <T extends Schema>(target: Target, schema: T) => {
	const validatorMiddleware = zValidator(target, schema, (res, ctx) => {
		if (!res.success) {
			return respond.err(
				ctx,
				jsonParse(res.error.message)
					// @ts-expect-error
					.map((m) => m.message.toString())
					.join("\n"),
				400,
			);
		}
	});

	return validatorMiddleware;
};

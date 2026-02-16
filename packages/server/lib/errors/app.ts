import type {
	ClientErrorStatusCode,
	ServerErrorStatusCode,
} from "hono/utils/http-status";

export abstract class AppError extends Error {
	public readonly code: string;
	public readonly status: ClientErrorStatusCode | ServerErrorStatusCode;

	constructor(
		message: string,
		code: string,
		status: ClientErrorStatusCode | ServerErrorStatusCode,
	) {
		super(message);
		this.code = code;
		this.status = status;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

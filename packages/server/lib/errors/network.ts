import { AppError } from "./app";

export class ServiceUnavailableError extends AppError {
	constructor(message = "Service unavailable") {
		super(message, "SERVICE_UNAVAILABLE", 503);
	}
}

export class TimeoutError extends AppError {
	constructor(message = "Operation timed out") {
		super(message, "TIMEOUT", 504);
	}
}

export class NotImplementedError extends AppError {
	constructor(message = "Feature not implemented") {
		super(message, "NOT_IMPLEMENTED", 501);
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad request") {
		super(message, "BAD_REQUEST", 400);
	}
}

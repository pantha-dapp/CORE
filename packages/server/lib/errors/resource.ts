import { AppError } from "./app";

export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(message, "NOT_FOUND", 404);
	}
}

export class AlreadyExistsError extends AppError {
	constructor(message = "Resource already exists") {
		super(message, "ALREADY_EXISTS", 409);
	}
}

export class ConflictError extends AppError {
	constructor(message = "Conflict occurred") {
		super(message, "CONFLICT", 409);
	}
}

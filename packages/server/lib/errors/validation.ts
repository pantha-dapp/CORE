import { AppError } from "./app";

export class ValidationError extends AppError {
	constructor(message = "Invalid input") {
		super(message, "VALIDATION_ERROR", 400);
	}
}

export class InvalidStateError extends AppError {
	constructor(message = "Invalid state transition") {
		super(message, "INVALID_STATE", 400);
	}
}

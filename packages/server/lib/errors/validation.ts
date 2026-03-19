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

export class PromptGuardError extends AppError {
	constructor(reason: string, code: string) {
		super(
			`Prompt validation failed: ${reason}`,
			`PROMPT_GUARD_${code.toUpperCase()}`,
			400,
		);
	}
}

import { AppError } from "./app";

export class UnauthorizedError extends AppError {
	constructor(message = "Authentication required") {
		super(message, "UNAUTHORIZED", 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "You do not have permission") {
		super(message, "FORBIDDEN", 403);
	}
}

export class AccountSuspendedError extends AppError {
	constructor(message = "Account is suspended") {
		super(message, "ACCOUNT_SUSPENDED", 403);
	}
}

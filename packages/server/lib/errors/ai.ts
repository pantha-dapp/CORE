import { AppError } from "./app";

export class GenerationFailedError extends AppError {
	constructor(message = "Content generation failed") {
		super(message, "GENERATION_FAILED", 502);
	}
}

export class RateLimitExceededError extends AppError {
	constructor(message = "Rate limit exceeded") {
		super(message, "RATE_LIMIT_EXCEEDED", 429);
	}
}

export class ModelUnavailableError extends AppError {
	constructor(message = "AI model unavailable") {
		super(message, "MODEL_UNAVAILABLE", 503);
	}
}

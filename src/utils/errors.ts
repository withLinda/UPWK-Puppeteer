import { logger } from './logger';

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class InputError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InputError';
    }
}

export class NavigationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NavigationError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class BrowserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BrowserError';
    }
}

export function handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (error instanceof AuthenticationError) {
        logger.error(`Authentication Error: ${errorMessage}`);
    } else if (error instanceof InputError) {
        logger.error(`Input Error: ${errorMessage}`);
    } else if (error instanceof NavigationError) {
        logger.error(`Navigation Error: ${errorMessage}`);
    } else if (error instanceof ValidationError) {
        logger.error(`Validation Error: ${errorMessage}`);
    } else if (error instanceof BrowserError) {
        logger.error(`Browser Error: ${errorMessage}`);
    } else {
        logger.error(`Unexpected Error: ${errorMessage}`);
    }

    // If error has a stack trace, log it
    if (error instanceof Error && error.stack) {
        logger.error(`Stack trace: ${error.stack}`);
    }

    process.exit(1);
}

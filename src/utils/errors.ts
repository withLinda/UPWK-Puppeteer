export class BaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BrowserError extends BaseError {
    constructor(message: string) {
        super(`Browser Error: ${message}`);
    }
}

export class AuthenticationError extends BaseError {
    constructor(message: string) {
        super(`Authentication Error: ${message}`);
    }
}

export class InputError extends BaseError {
    constructor(message: string) {
        super(`Input Error: ${message}`);
    }
}

export class NavigationError extends BaseError {
    constructor(message: string) {
        super(`Navigation Error: ${message}`);
    }
}

export class StorageError extends BaseError {
    constructor(message: string) {
        super(`Storage Error: ${message}`);
    }
}

export function handleError(error: unknown): never {
    if (error instanceof BaseError) {
        console.error(`${error.name}: ${error.message}`);
        console.error('Stack trace:', error.stack);
        throw error;
    }

    if (error instanceof Error) {
        console.error('Unhandled Error:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    }

    console.error('Unknown error:', error);
    throw new Error('An unknown error occurred');
}

export function assertNonNull<T>(value: T | null | undefined, message: string): T {
    if (value === null || value === undefined) {
        throw new Error(message);
    }
    return value;
}

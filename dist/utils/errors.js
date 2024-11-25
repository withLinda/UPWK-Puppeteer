"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageError = exports.NavigationError = exports.InputError = exports.AuthenticationError = exports.BrowserError = exports.BaseError = void 0;
exports.handleError = handleError;
exports.assertNonNull = assertNonNull;
class BaseError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BaseError = BaseError;
class BrowserError extends BaseError {
    constructor(message) {
        super(`Browser Error: ${message}`);
    }
}
exports.BrowserError = BrowserError;
class AuthenticationError extends BaseError {
    constructor(message) {
        super(`Authentication Error: ${message}`);
    }
}
exports.AuthenticationError = AuthenticationError;
class InputError extends BaseError {
    constructor(message) {
        super(`Input Error: ${message}`);
    }
}
exports.InputError = InputError;
class NavigationError extends BaseError {
    constructor(message) {
        super(`Navigation Error: ${message}`);
    }
}
exports.NavigationError = NavigationError;
class StorageError extends BaseError {
    constructor(message) {
        super(`Storage Error: ${message}`);
    }
}
exports.StorageError = StorageError;
function handleError(error) {
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
function assertNonNull(value, message) {
    if (value === null || value === undefined) {
        throw new Error(message);
    }
    return value;
}
//# sourceMappingURL=errors.js.map
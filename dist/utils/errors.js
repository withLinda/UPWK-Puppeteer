"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserError = exports.ValidationError = exports.NavigationError = exports.InputError = exports.AuthenticationError = void 0;
exports.handleError = handleError;
const logger_1 = require("./logger");
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class InputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InputError';
    }
}
exports.InputError = InputError;
class NavigationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NavigationError';
    }
}
exports.NavigationError = NavigationError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class BrowserError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BrowserError';
    }
}
exports.BrowserError = BrowserError;
function handleError(error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof AuthenticationError) {
        logger_1.logger.error(`Authentication Error: ${errorMessage}`);
    }
    else if (error instanceof InputError) {
        logger_1.logger.error(`Input Error: ${errorMessage}`);
    }
    else if (error instanceof NavigationError) {
        logger_1.logger.error(`Navigation Error: ${errorMessage}`);
    }
    else if (error instanceof ValidationError) {
        logger_1.logger.error(`Validation Error: ${errorMessage}`);
    }
    else if (error instanceof BrowserError) {
        logger_1.logger.error(`Browser Error: ${errorMessage}`);
    }
    else {
        logger_1.logger.error(`Unexpected Error: ${errorMessage}`);
    }
    // If error has a stack trace, log it
    if (error instanceof Error && error.stack) {
        logger_1.logger.error(`Stack trace: ${error.stack}`);
    }
    process.exit(1);
}
//# sourceMappingURL=errors.js.map
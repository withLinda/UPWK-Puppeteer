export declare class AuthenticationError extends Error {
    constructor(message: string);
}
export declare class InputError extends Error {
    constructor(message: string);
}
export declare class NavigationError extends Error {
    constructor(message: string);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class BrowserError extends Error {
    constructor(message: string);
}
export declare function handleError(error: unknown): void;

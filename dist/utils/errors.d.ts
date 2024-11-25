export declare class BaseError extends Error {
    constructor(message: string);
}
export declare class BrowserError extends BaseError {
    constructor(message: string);
}
export declare class AuthenticationError extends BaseError {
    constructor(message: string);
}
export declare class InputError extends BaseError {
    constructor(message: string);
}
export declare class NavigationError extends BaseError {
    constructor(message: string);
}
export declare class StorageError extends BaseError {
    constructor(message: string);
}
export declare function handleError(error: unknown): never;
export declare function assertNonNull<T>(value: T | null | undefined, message: string): T;

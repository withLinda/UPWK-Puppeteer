declare class Logger {
    private logFile;
    private stream;
    private static MAX_OBJECT_LENGTH;
    constructor();
    private formatMessage;
    log(message: any, level?: 'info' | 'error' | 'warn'): void;
    error(message: any): void;
    warn(message: any): void;
    info(message: any): void;
    close(): void;
}
export declare const logger: Logger;
export {};

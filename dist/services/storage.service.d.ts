export declare const ensureDirectoryExists: (filePath: string) => void;
export declare const saveToFile: (filePath: string, data: unknown) => boolean;
export declare const loadFromFile: <T>(filePath: string) => T | null;

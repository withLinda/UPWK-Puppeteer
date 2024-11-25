import fs from 'fs';
import path from 'path';

export const ensureDirectoryExists = (filePath: string): void => {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
        console.log(`Created directory: ${dirname}`);
    }
};

export const saveToFile = (filePath: string, data: unknown): boolean => {
    try {
        ensureDirectoryExists(filePath);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error saving to ${filePath}:`, error);
        return false;
    }
};

export const loadFromFile = <T>(filePath: string): T | null => {
    try {
        if (!fs.existsSync(filePath)) return null;
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data) as T;
    } catch (error) {
        console.error(`Error loading from ${filePath}:`, error);
        return null;
    }
};

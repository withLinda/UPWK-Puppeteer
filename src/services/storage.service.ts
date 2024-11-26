import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Ensures a directory exists, creating it if necessary
 */
function ensureDirectoryExists(filePath: string): void {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
        logger.info({ directoryCreated: dirname });
    }
}

/**
 * Saves data to a file
 * @param filePath Path to save the file
 * @param data Data to save
 * @returns boolean indicating success
 */
export function saveToFile(filePath: string, data: any): boolean {
    try {
        ensureDirectoryExists(filePath);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        logger.info({ fileSaved: filePath });
        return true;
    } catch (error) {
        logger.error({
            operation: 'saveToFile',
            path: filePath,
            error
        });
        return false;
    }
}

/**
 * Loads data from a file
 * @param filePath Path to load the file from
 * @returns The loaded data or null if failed
 */
export function loadFromFile<T>(filePath: string): T | null {
    try {
        if (!fs.existsSync(filePath)) {
            logger.info({ fileNotFound: filePath });
            return null;
        }

        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data) as T;
        logger.info({ fileLoaded: filePath });
        return parsed;
    } catch (error) {
        logger.error({
            operation: 'loadFromFile',
            path: filePath,
            error
        });
        return null;
    }
}

/**
 * Checks if a file exists
 * @param filePath Path to check
 * @returns boolean indicating if file exists
 */
export function fileExists(filePath: string): boolean {
    const exists = fs.existsSync(filePath);
    logger.info({
        fileCheck: {
            path: filePath,
            exists
        }
    });
    return exists;
}

/**
 * Deletes a file if it exists
 * @param filePath Path to delete
 * @returns boolean indicating success
 */
export function deleteFile(filePath: string): boolean {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info({ fileDeleted: filePath });
            return true;
        }
        logger.info({ fileNotFound: filePath });
        return false;
    } catch (error) {
        logger.error({
            operation: 'deleteFile',
            path: filePath,
            error
        });
        return false;
    }
}

/**
 * Gets file stats if file exists
 * @param filePath Path to check
 * @returns File stats or null if file doesn't exist
 */
export function getFileStats(filePath: string): fs.Stats | null {
    try {
        if (!fs.existsSync(filePath)) {
            logger.info({ fileNotFound: filePath });
            return null;
        }

        const stats = fs.statSync(filePath);
        logger.info({
            fileStats: {
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            }
        });
        return stats;
    } catch (error) {
        logger.error({
            operation: 'getFileStats',
            path: filePath,
            error
        });
        return null;
    }
}

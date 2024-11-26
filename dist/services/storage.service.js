"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToFile = saveToFile;
exports.loadFromFile = loadFromFile;
exports.fileExists = fileExists;
exports.deleteFile = deleteFile;
exports.getFileStats = getFileStats;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
/**
 * Ensures a directory exists, creating it if necessary
 */
function ensureDirectoryExists(filePath) {
    const dirname = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dirname)) {
        fs_1.default.mkdirSync(dirname, { recursive: true });
        logger_1.logger.info({ directoryCreated: dirname });
    }
}
/**
 * Saves data to a file
 * @param filePath Path to save the file
 * @param data Data to save
 * @returns boolean indicating success
 */
function saveToFile(filePath, data) {
    try {
        ensureDirectoryExists(filePath);
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
        logger_1.logger.info({ fileSaved: filePath });
        return true;
    }
    catch (error) {
        logger_1.logger.error({
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
function loadFromFile(filePath) {
    try {
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.logger.info({ fileNotFound: filePath });
            return null;
        }
        const data = fs_1.default.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        logger_1.logger.info({ fileLoaded: filePath });
        return parsed;
    }
    catch (error) {
        logger_1.logger.error({
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
function fileExists(filePath) {
    const exists = fs_1.default.existsSync(filePath);
    logger_1.logger.info({
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
function deleteFile(filePath) {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            logger_1.logger.info({ fileDeleted: filePath });
            return true;
        }
        logger_1.logger.info({ fileNotFound: filePath });
        return false;
    }
    catch (error) {
        logger_1.logger.error({
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
function getFileStats(filePath) {
    try {
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.logger.info({ fileNotFound: filePath });
            return null;
        }
        const stats = fs_1.default.statSync(filePath);
        logger_1.logger.info({
            fileStats: {
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            }
        });
        return stats;
    }
    catch (error) {
        logger_1.logger.error({
            operation: 'getFileStats',
            path: filePath,
            error
        });
        return null;
    }
}
//# sourceMappingURL=storage.service.js.map
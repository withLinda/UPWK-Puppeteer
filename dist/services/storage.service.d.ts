import fs from 'fs';
/**
 * Saves data to a file
 * @param filePath Path to save the file
 * @param data Data to save
 * @returns boolean indicating success
 */
export declare function saveToFile(filePath: string, data: any): boolean;
/**
 * Loads data from a file
 * @param filePath Path to load the file from
 * @returns The loaded data or null if failed
 */
export declare function loadFromFile<T>(filePath: string): T | null;
/**
 * Checks if a file exists
 * @param filePath Path to check
 * @returns boolean indicating if file exists
 */
export declare function fileExists(filePath: string): boolean;
/**
 * Deletes a file if it exists
 * @param filePath Path to delete
 * @returns boolean indicating success
 */
export declare function deleteFile(filePath: string): boolean;
/**
 * Gets file stats if file exists
 * @param filePath Path to check
 * @returns File stats or null if file doesn't exist
 */
export declare function getFileStats(filePath: string): fs.Stats | null;

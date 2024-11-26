import { Page } from 'puppeteer';
/**
 * Checks if the user is currently logged in
 * @param page Puppeteer Page instance
 * @returns boolean indicating login status
 */
export declare function isLoggedIn(page: Page): Promise<boolean>;

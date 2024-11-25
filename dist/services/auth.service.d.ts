import { Page } from 'puppeteer';
export declare function saveAuthData(page: Page): Promise<boolean>;
export declare function loadAuthData(page: Page): Promise<boolean>;
export declare function isLoggedIn(page: Page): Promise<boolean>;

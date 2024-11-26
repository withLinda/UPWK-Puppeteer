import { Page, CookieParam } from 'puppeteer';
import { STORAGE_PATHS, CRITICAL_COOKIES } from '../config';
import { loadFromFile } from './storage.service';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';

interface LocalStorageData {
    [key: string]: string;
}

interface LocalStorageResult {
    success: boolean;
    error?: string;
}

export async function loadAuthData(page: Page): Promise<boolean> {
    try {
        logger.info('Starting authentication data load');

        const cookies = loadFromFile<CookieParam[]>(STORAGE_PATHS.COOKIE_PATH);
        const localStorage = loadFromFile<LocalStorageData>(STORAGE_PATHS.LOCALSTORAGE_PATH);

        if (!cookies || !localStorage) {
            logger.info({
                authDataMissing: {
                    cookies: !cookies,
                    localStorage: !localStorage,
                    cookiePath: STORAGE_PATHS.COOKIE_PATH,
                    localStoragePath: STORAGE_PATHS.LOCALSTORAGE_PATH
                }
            });
            return false;
        }

        logger.info({
            authDataLoaded: {
                cookiesCount: cookies.length,
                localStorageKeys: Object.keys(localStorage).length
            }
        });

        await page.setCookie(...cookies);

        const localStorageResult = await page.evaluate((data: LocalStorageData): LocalStorageResult => {
            try {
                window.localStorage.clear();
                for (const [key, value] of Object.entries(data)) {
                    window.localStorage.setItem(key, value);
                }
                return { success: true };
            } catch (e) {
                return { success: false, error: e instanceof Error ? e.toString() : String(e) };
            }
        }, localStorage);

        logger.info({
            localStorageSetup: {
                success: localStorageResult.success,
                error: localStorageResult.error
            }
        });

        if (!localStorageResult.success) {
            return false;
        }

        // Verify critical cookies
        const currentCookies = await page.cookies();
        const missingCookies = CRITICAL_COOKIES.filter(
            (name: string) => !currentCookies.some((cookie) => cookie.name === name)
        );

        logger.info({
            cookieVerification: {
                total: currentCookies.length,
                critical: CRITICAL_COOKIES.length,
                missing: missingCookies.length,
                missingNames: missingCookies
            }
        });

        if (missingCookies.length > 0) {
            return false;
        }

        // Final verification of auth state
        const authState = await page.evaluate(() => ({
            cookiesPresent: document.cookie.length > 0,
            localStorageItems: Object.keys(localStorage).length,
            url: window.location.href
        }));

        logger.info({
            authStateVerification: authState
        });

        return true;
    } catch (error) {
        logger.error({
            operation: 'loadAuthData',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            url: page.url()
        });

        throw new AuthenticationError(
            `Failed to load auth data: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

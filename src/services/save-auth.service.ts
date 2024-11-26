import { Page } from 'puppeteer';
import { STORAGE_PATHS } from '../config';
import { saveToFile } from './storage.service';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';

interface LocalStorageData {
    [key: string]: string;
}

export async function saveAuthData(page: Page): Promise<boolean> {
    try {
        logger.info('Starting authentication data save');

        const cookies = await page.cookies();
        logger.info({
            cookiesCollected: {
                count: cookies.length,
                names: cookies.map(c => c.name)
            }
        });

        const localStorage = await page.evaluate((): LocalStorageData => {
            const data: LocalStorageData = {};
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                if (key) {
                    const value = window.localStorage.getItem(key);
                    if (value) {
                        data[key] = value;
                    }
                }
            }
            return data;
        });

        logger.info({
            localStorageCollected: {
                count: Object.keys(localStorage).length,
                keys: Object.keys(localStorage)
            }
        });

        const cookiesSaved = saveToFile(STORAGE_PATHS.COOKIE_PATH, cookies);
        const localStorageSaved = saveToFile(STORAGE_PATHS.LOCALSTORAGE_PATH, localStorage);

        logger.info({
            authDataSaved: {
                cookies: cookiesSaved,
                localStorage: localStorageSaved,
                cookiePath: STORAGE_PATHS.COOKIE_PATH,
                localStoragePath: STORAGE_PATHS.LOCALSTORAGE_PATH
            }
        });

        if (!cookiesSaved || !localStorageSaved) {
            throw new AuthenticationError("Failed to save authentication data");
        }

        return true;
    } catch (error) {
        logger.error({
            operation: 'saveAuthData',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });

        throw new AuthenticationError(
            `Failed to save auth data: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

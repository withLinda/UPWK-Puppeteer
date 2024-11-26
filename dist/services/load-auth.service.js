"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAuthData = loadAuthData;
const config_1 = require("../config");
const storage_service_1 = require("./storage.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
async function loadAuthData(page) {
    try {
        logger_1.logger.info('Starting authentication data load');
        const cookies = (0, storage_service_1.loadFromFile)(config_1.STORAGE_PATHS.COOKIE_PATH);
        const localStorage = (0, storage_service_1.loadFromFile)(config_1.STORAGE_PATHS.LOCALSTORAGE_PATH);
        if (!cookies || !localStorage) {
            logger_1.logger.info({
                authDataMissing: {
                    cookies: !cookies,
                    localStorage: !localStorage,
                    cookiePath: config_1.STORAGE_PATHS.COOKIE_PATH,
                    localStoragePath: config_1.STORAGE_PATHS.LOCALSTORAGE_PATH
                }
            });
            return false;
        }
        logger_1.logger.info({
            authDataLoaded: {
                cookiesCount: cookies.length,
                localStorageKeys: Object.keys(localStorage).length
            }
        });
        await page.setCookie(...cookies);
        const localStorageResult = await page.evaluate((data) => {
            try {
                window.localStorage.clear();
                for (const [key, value] of Object.entries(data)) {
                    window.localStorage.setItem(key, value);
                }
                return { success: true };
            }
            catch (e) {
                return { success: false, error: e instanceof Error ? e.toString() : String(e) };
            }
        }, localStorage);
        logger_1.logger.info({
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
        const missingCookies = config_1.CRITICAL_COOKIES.filter((name) => !currentCookies.some((cookie) => cookie.name === name));
        logger_1.logger.info({
            cookieVerification: {
                total: currentCookies.length,
                critical: config_1.CRITICAL_COOKIES.length,
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
        logger_1.logger.info({
            authStateVerification: authState
        });
        return true;
    }
    catch (error) {
        logger_1.logger.error({
            operation: 'loadAuthData',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            url: page.url()
        });
        throw new errors_1.AuthenticationError(`Failed to load auth data: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=load-auth.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAuthData = saveAuthData;
const config_1 = require("../config");
const storage_service_1 = require("./storage.service");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
async function saveAuthData(page) {
    try {
        logger_1.logger.info('Starting authentication data save');
        const cookies = await page.cookies();
        logger_1.logger.info({
            cookiesCollected: {
                count: cookies.length,
                names: cookies.map(c => c.name)
            }
        });
        const localStorage = await page.evaluate(() => {
            const data = {};
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
        logger_1.logger.info({
            localStorageCollected: {
                count: Object.keys(localStorage).length,
                keys: Object.keys(localStorage)
            }
        });
        const cookiesSaved = (0, storage_service_1.saveToFile)(config_1.STORAGE_PATHS.COOKIE_PATH, cookies);
        const localStorageSaved = (0, storage_service_1.saveToFile)(config_1.STORAGE_PATHS.LOCALSTORAGE_PATH, localStorage);
        logger_1.logger.info({
            authDataSaved: {
                cookies: cookiesSaved,
                localStorage: localStorageSaved,
                cookiePath: config_1.STORAGE_PATHS.COOKIE_PATH,
                localStoragePath: config_1.STORAGE_PATHS.LOCALSTORAGE_PATH
            }
        });
        if (!cookiesSaved || !localStorageSaved) {
            throw new errors_1.AuthenticationError("Failed to save authentication data");
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error({
            operation: 'saveAuthData',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        throw new errors_1.AuthenticationError(`Failed to save auth data: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=save-auth.service.js.map
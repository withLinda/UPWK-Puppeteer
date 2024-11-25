"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAuthData = saveAuthData;
exports.loadAuthData = loadAuthData;
exports.isLoggedIn = isLoggedIn;
const config_1 = require("../config");
const storage_service_1 = require("./storage.service");
const errors_1 = require("../utils/errors");
async function handleCookieConsent(page) {
    try {
        // Check if cookie banner exists
        const cookieBanner = await page.$(config_1.SELECTORS.COOKIE_CONSENT.BANNER);
        if (cookieBanner) {
            console.log("Cookie consent banner detected, accepting cookies...");
            // Wait for button to be visible and ensure page is fully loaded
            await page.waitForSelector(config_1.SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON, {
                visible: true,
                timeout: 5000
            });
            // Add a small delay to ensure the banner is fully rendered
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                // First attempt: Try normal click
                await page.click(config_1.SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);
            }
            catch (clickError) {
                console.log("Normal click failed, trying JavaScript click...");
                // Second attempt: Try JavaScript click
                await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (button) {
                        button.click();
                    }
                }, config_1.SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);
            }
            console.log("Cookies accepted");
            // Wait for banner to disappear
            await page.waitForSelector(config_1.SELECTORS.COOKIE_CONSENT.BANNER, {
                hidden: true,
                timeout: 5000
            });
        }
    }
    catch (error) {
        console.log("Error handling cookie consent:", error instanceof Error ? error.message : String(error));
    }
}
async function saveAuthData(page) {
    try {
        const cookies = await page.cookies();
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
        const cookiesSaved = (0, storage_service_1.saveToFile)(config_1.STORAGE_PATHS.COOKIE_PATH, cookies);
        const localStorageSaved = (0, storage_service_1.saveToFile)(config_1.STORAGE_PATHS.LOCALSTORAGE_PATH, localStorage);
        if (cookiesSaved)
            console.log("Cookies saved successfully");
        if (localStorageSaved)
            console.log("localStorage saved successfully");
        if (!cookiesSaved || !localStorageSaved) {
            throw new errors_1.AuthenticationError("Failed to save authentication data");
        }
        return true;
    }
    catch (error) {
        throw new errors_1.AuthenticationError(`Failed to save auth data: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function loadAuthData(page) {
    try {
        const cookies = (0, storage_service_1.loadFromFile)(config_1.STORAGE_PATHS.COOKIE_PATH);
        const localStorage = (0, storage_service_1.loadFromFile)(config_1.STORAGE_PATHS.LOCALSTORAGE_PATH);
        if (!cookies || !localStorage) {
            console.log("No saved authentication data found");
            return false;
        }
        await page.setCookie(...cookies);
        console.log("Cookies loaded successfully");
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
        if (localStorageResult.success) {
            console.log("localStorage data loaded successfully");
        }
        else {
            console.log("localStorage error:", localStorageResult.error);
            return false;
        }
        // Verify critical cookies
        const currentCookies = await page.cookies();
        const missingCookies = config_1.CRITICAL_COOKIES.filter((name) => !currentCookies.some((cookie) => cookie.name === name));
        if (missingCookies.length > 0) {
            console.log("Warning: Some critical cookies are missing:", missingCookies);
            return false;
        }
        return true;
    }
    catch (error) {
        throw new errors_1.AuthenticationError(`Failed to load auth data: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function isLoggedIn(page) {
    try {
        // Navigate to dashboard first
        await page.goto(config_1.URLS.DASHBOARD, {
            waitUntil: ["domcontentloaded", "networkidle0"],
            timeout: 30000
        });
        // Handle cookie consent banner if present
        await handleCookieConsent(page);
        // Check for the two required elements that indicate logged-in state
        const loginVerificationSelectors = [
            '#fwh-sidebar-profile',
            'div[data-test="sidebar-connects-card"]'
        ];
        let verifiedElements = 0;
        for (const selector of loginVerificationSelectors) {
            try {
                await page.waitForSelector(selector, {
                    visible: true,
                    timeout: 20000
                });
                verifiedElements++;
                console.log(`Verified element: ${selector}`);
            }
            catch (e) {
                console.log(`Selector ${selector} not found`);
            }
        }
        // Consider logged in if both verification elements are present
        if (verifiedElements === 2) {
            console.log(`Login verified with both required elements`);
            return true;
        }
        // Check for login form as a definitive sign of being logged out
        const loginForm = await page.$(config_1.SELECTORS.LOGIN.EMAIL_INPUT);
        if (loginForm) {
            console.log("Login form detected, user is not logged in");
            return false;
        }
        console.log(`Warning: Only ${verifiedElements}/2 verification elements found`);
        return false;
    }
    catch (error) {
        console.log("Error checking login status:", error instanceof Error ? error.message : String(error));
        return false;
    }
}
//# sourceMappingURL=auth.service.js.map
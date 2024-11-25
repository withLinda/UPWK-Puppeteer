import { Page, CookieParam } from 'puppeteer';
import { STORAGE_PATHS, SELECTORS, CRITICAL_COOKIES, URLS } from '../config';
import { saveToFile, loadFromFile } from './storage.service';
import { AuthenticationError } from '../utils/errors';

interface LocalStorageData {
    [key: string]: string;
}

interface LocalStorageResult {
    success: boolean;
    error?: string;
}

async function handleCookieConsent(page: Page): Promise<void> {
    try {
        // Check if cookie banner exists
        const cookieBanner = await page.$(SELECTORS.COOKIE_CONSENT.BANNER);
        if (cookieBanner) {
            console.log("Cookie consent banner detected, accepting cookies...");

            // Wait for button to be visible and ensure page is fully loaded
            await page.waitForSelector(SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON, {
                visible: true,
                timeout: 5000
            });

            // Add a small delay to ensure the banner is fully rendered
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                // First attempt: Try normal click
                await page.click(SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);
            } catch (clickError) {
                console.log("Normal click failed, trying JavaScript click...");
                // Second attempt: Try JavaScript click
                await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (button) {
                        (button as HTMLElement).click();
                    }
                }, SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);
            }

            console.log("Cookies accepted");

            // Wait for banner to disappear
            await page.waitForSelector(SELECTORS.COOKIE_CONSENT.BANNER, {
                hidden: true,
                timeout: 5000
            });
        }
    } catch (error) {
        console.log("Error handling cookie consent:", error instanceof Error ? error.message : String(error));
    }
}

export async function saveAuthData(page: Page): Promise<boolean> {
    try {
        const cookies = await page.cookies();
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

        const cookiesSaved = saveToFile(STORAGE_PATHS.COOKIE_PATH, cookies);
        const localStorageSaved = saveToFile(STORAGE_PATHS.LOCALSTORAGE_PATH, localStorage);

        if (cookiesSaved) console.log("Cookies saved successfully");
        if (localStorageSaved) console.log("localStorage saved successfully");

        if (!cookiesSaved || !localStorageSaved) {
            throw new AuthenticationError("Failed to save authentication data");
        }

        return true;
    } catch (error) {
        throw new AuthenticationError(
            `Failed to save auth data: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

export async function loadAuthData(page: Page): Promise<boolean> {
    try {
        const cookies = loadFromFile<CookieParam[]>(STORAGE_PATHS.COOKIE_PATH);
        const localStorage = loadFromFile<LocalStorageData>(STORAGE_PATHS.LOCALSTORAGE_PATH);

        if (!cookies || !localStorage) {
            console.log("No saved authentication data found");
            return false;
        }

        await page.setCookie(...cookies);
        console.log("Cookies loaded successfully");

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

        if (localStorageResult.success) {
            console.log("localStorage data loaded successfully");
        } else {
            console.log("localStorage error:", localStorageResult.error);
            return false;
        }

        // Verify critical cookies
        const currentCookies = await page.cookies();
        const missingCookies = CRITICAL_COOKIES.filter(
            (name: string) => !currentCookies.some((cookie) => cookie.name === name)
        );

        if (missingCookies.length > 0) {
            console.log(
                "Warning: Some critical cookies are missing:",
                missingCookies
            );
            return false;
        }

        return true;
    } catch (error) {
        throw new AuthenticationError(
            `Failed to load auth data: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

export async function isLoggedIn(page: Page): Promise<boolean> {
    try {
        // Navigate to dashboard first
        await page.goto(URLS.DASHBOARD, {
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
            } catch (e) {
                console.log(`Selector ${selector} not found`);
            }
        }

        // Consider logged in if both verification elements are present
        if (verifiedElements === 2) {
            console.log(`Login verified with both required elements`);
            return true;
        }

        // Check for login form as a definitive sign of being logged out
        const loginForm = await page.$(SELECTORS.LOGIN.EMAIL_INPUT);
        if (loginForm) {
            console.log("Login form detected, user is not logged in");
            return false;
        }

        console.log(`Warning: Only ${verifiedElements}/2 verification elements found`);
        return false;

    } catch (error) {
        console.log(
            "Error checking login status:",
            error instanceof Error ? error.message : String(error)
        );
        return false;
    }
}

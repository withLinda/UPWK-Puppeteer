"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLoggedIn = isLoggedIn;
const logger_1 = require("../utils/logger");
/**
 * Checks if the user is currently logged in
 * @param page Puppeteer Page instance
 * @returns boolean indicating login status
 */
async function isLoggedIn(page) {
    try {
        const currentUrl = page.url();
        logger_1.logger.info({
            loginCheck: {
                url: currentUrl
            }
        });
        // Check for definitive logged-in elements regardless of URL
        const loggedInState = await page.evaluate(() => {
            // Check for sidebar profile section
            const sidebarProfile = document.querySelector('#fwh-sidebar-profile');
            const sidebarLinks = document.querySelector('#fwh-sidebar-links');
            const connectsSection = document.querySelector('[data-test="connects-section"]');
            const profileSection = document.querySelector('[data-test="freelancer-sidebar-profile"]');
            // Get profile name if available
            const profileName = document.querySelector('[data-test="freelancer-sidebar-profile"] h3.h5 a');
            const profileNameText = profileName ? profileName.textContent?.trim() : null;
            // Check for other logged-in indicators
            const loginForm = document.querySelector('#login-form');
            const loginButton = document.querySelector('#login_control_continue');
            return {
                hasSidebarProfile: !!sidebarProfile,
                hasSidebarLinks: !!sidebarLinks,
                hasConnectsSection: !!connectsSection,
                hasProfileSection: !!profileSection,
                profileName: profileNameText,
                hasLoginForm: !!loginForm,
                hasLoginButton: !!loginButton,
                cookies: document.cookie.length > 0,
                localStorage: Object.keys(localStorage).length > 0,
                url: window.location.href
            };
        });
        logger_1.logger.info({ loggedInState });
        // If we have definitive logged-in elements, we're logged in regardless of URL
        if (loggedInState.hasSidebarProfile && loggedInState.hasProfileSection) {
            logger_1.logger.info('Definitive logged-in elements found');
            return true;
        }
        // If we see the login form or button, we're definitely not logged in
        if (loggedInState.hasLoginForm || loggedInState.hasLoginButton) {
            logger_1.logger.info('Login form elements found, user is not logged in');
            return false;
        }
        // If we're on a protected page and have auth data
        if (loggedInState.url.includes('/nx/find-work') && loggedInState.cookies && loggedInState.localStorage) {
            // Look for any of our logged-in indicators
            if (loggedInState.hasSidebarLinks || loggedInState.hasConnectsSection) {
                logger_1.logger.info('Protected page elements found, user appears to be logged in');
                return true;
            }
        }
        // Get final page state for logging
        const pageState = await page.evaluate(() => {
            return {
                url: window.location.href,
                cookies: document.cookie.length > 0,
                localStorage: Object.keys(localStorage).length > 0,
                documentReady: document.readyState,
                visibleElements: Array.from(document.querySelectorAll('*'))
                    .filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0';
                })
                    .map(el => ({
                    tag: el.tagName.toLowerCase(),
                    id: el.id,
                    classes: Array.from(el.classList)
                }))
            };
        });
        logger_1.logger.info({ finalPageState: pageState });
        // If we got here, we couldn't definitively confirm logged-in state
        return false;
    }
    catch (error) {
        logger_1.logger.error({
            loginCheckError: {
                error: error instanceof Error ? error.message : String(error),
                url: page.url()
            }
        });
        return false;
    }
}
//# sourceMappingURL=login-check.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthFlowService = void 0;
const input_service_1 = require("./input.service");
const delay_1 = require("../utils/delay");
const auth_service_1 = require("./auth.service");
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
class AuthFlowService {
    constructor(page) {
        this.page = page;
        this.inputService = new input_service_1.InputService(page);
    }
    async handleCookieConsent() {
        try {
            console.log("Starting cookie consent check...");
            // First check if the banner container exists and is visible
            console.log("Checking for cookie consent banner visibility...");
            const bannerVisible = await this.page.evaluate(() => {
                console.log("Checking outer container (#onetrust-consent-sdk)...");
                const banner = document.querySelector('#onetrust-consent-sdk');
                if (!banner) {
                    console.log("Outer container not found");
                    return false;
                }
                console.log("Checking outer container visibility...");
                const bannerStyle = window.getComputedStyle(banner);
                if (bannerStyle.display === 'none' || bannerStyle.visibility === 'hidden') {
                    console.log("Outer container is hidden");
                    return false;
                }
                console.log("Checking inner banner (#onetrust-banner-sdk)...");
                const bannerSdk = banner.querySelector('#onetrust-banner-sdk');
                if (!bannerSdk) {
                    console.log("Inner banner not found");
                    return false;
                }
                console.log("Checking inner banner visibility...");
                const bannerSdkStyle = window.getComputedStyle(bannerSdk);
                const isVisible = bannerSdkStyle.display !== 'none' && bannerSdkStyle.visibility !== 'hidden';
                console.log(`Inner banner visibility: ${isVisible}`);
                return isVisible;
            });
            if (bannerVisible) {
                console.log("Cookie consent banner is visible and active");
                // Click the accept button
                console.log("Attempting to click 'Accept All' button...");
                const buttonClicked = await this.page.evaluate(() => {
                    const acceptButton = document.querySelector(config_1.SELECTORS.COOKIE_CONSENT.ACCEPT_BUTTON);
                    if (acceptButton && acceptButton instanceof HTMLElement) {
                        console.log("'Accept All' button found, clicking...");
                        acceptButton.click();
                        return true;
                    }
                    console.log("'Accept All' button not found");
                    return false;
                });
                if (buttonClicked) {
                    console.log("'Accept All' button clicked successfully");
                    // Wait for banner to disappear
                    console.log("Waiting for banner to disappear...");
                    await this.page.waitForFunction(() => {
                        console.log("Checking if banner is hidden...");
                        const banner = document.querySelector('#onetrust-consent-sdk');
                        if (!banner) {
                            console.log("Banner element no longer exists");
                            return true;
                        }
                        const bannerStyle = window.getComputedStyle(banner);
                        if (bannerStyle.display === 'none' || bannerStyle.visibility === 'hidden') {
                            console.log("Outer container is now hidden");
                            return true;
                        }
                        const bannerSdk = banner.querySelector('#onetrust-banner-sdk');
                        if (!bannerSdk) {
                            console.log("Inner banner no longer exists");
                            return true;
                        }
                        const bannerSdkStyle = window.getComputedStyle(bannerSdk);
                        const isHidden = bannerSdkStyle.display === 'none' || bannerSdkStyle.visibility === 'hidden';
                        console.log(`Inner banner hidden state: ${isHidden}`);
                        return isHidden;
                    }, { timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT });
                    console.log("Cookie consent banner has been successfully hidden");
                }
                else {
                    console.log("Failed to click 'Accept All' button");
                }
            }
            else {
                console.log("No active cookie consent banner detected");
            }
        }
        catch (error) {
            console.log("Cookie consent handling error (non-critical):", error instanceof Error ? error.message : String(error));
        }
    }
    async handleSecurityQuestion(securityAnswer) {
        try {
            await this.page.waitForSelector('#login_answer', {
                visible: true,
                timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT,
            });
            console.log("Security question detected");
            await this.inputService.handleInput('#login_answer', securityAnswer, {
                isPassword: true,
                preTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
                postTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
            });
            // Handle "Remember this device" checkbox
            try {
                const rememberDeviceCheckbox = await this.page.$('span[data-test="checkbox-input"]');
                if (rememberDeviceCheckbox) {
                    await this.inputService.moveMouseNaturally(rememberDeviceCheckbox);
                    await this.page.click('span[data-test="checkbox-input"]');
                    await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
                }
            }
            catch (error) {
                console.log("Could not find or interact with 'Remember this device' checkbox");
            }
            const continueButton = await this.page.$(config_1.SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
            if (continueButton) {
                await this.inputService.moveMouseNaturally(continueButton);
                await this.page.click(config_1.SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.LONG));
            }
            return true;
        }
        catch (error) {
            console.log("No security question present or error handling it:", error instanceof Error ? error.message : String(error));
            return false;
        }
    }
    async handleProfileModal() {
        try {
            console.log("Checking for profile completion modal...");
            await this.page.waitForSelector(config_1.SELECTORS.MODALS.PROFILE_MODAL, {
                visible: true,
                timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT,
            });
            for (const selector of config_1.SELECTORS.MODALS.CLOSE_BUTTONS) {
                try {
                    const closeButton = await this.page.$(selector);
                    if (closeButton) {
                        console.log(`Found close button with selector: ${selector}`);
                        await this.inputService.moveMouseNaturally(closeButton);
                        await this.page.click(selector);
                        await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
                        const modalStillVisible = await this.page.evaluate((modalSel) => {
                            const modal = document.querySelector(modalSel);
                            return modal ? window.getComputedStyle(modal).display !== "none" : false;
                        }, config_1.SELECTORS.MODALS.PROFILE_MODAL);
                        if (!modalStillVisible) {
                            console.log("Successfully closed profile completion modal");
                            break;
                        }
                    }
                }
                catch (err) {
                    console.log(`Failed to close modal with selector ${selector}:`, err instanceof Error ? err.message : String(err));
                }
            }
        }
        catch (error) {
            console.log("No profile completion modal found or error closing it:", error instanceof Error ? error.message : String(error));
        }
    }
    async handlePopovers() {
        try {
            let keepTrying = true;
            let attempts = 0;
            const maxAttempts = 5;
            while (keepTrying && attempts < maxAttempts) {
                try {
                    console.log(`Checking for popovers (attempt ${attempts + 1})...`);
                    await this.page.waitForSelector(config_1.SELECTORS.POPOVERS.CLOSE_BUTTON, {
                        visible: true,
                        timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT,
                    });
                    const closeButtons = await this.page.$$eval(config_1.SELECTORS.POPOVERS.CLOSE_BUTTON, (buttons) => buttons.filter((btn) => {
                        const style = window.getComputedStyle(btn);
                        return style.display !== "none" && style.visibility !== "hidden";
                    }).length);
                    if (closeButtons === 0) {
                        console.log("No more visible popovers found");
                        keepTrying = false;
                        break;
                    }
                    for (let i = 0; i < closeButtons; i++) {
                        await this.page.evaluate((selector, index) => {
                            const buttons = Array.from(document.querySelectorAll(selector));
                            const visibleButtons = buttons.filter((btn) => {
                                const style = window.getComputedStyle(btn);
                                return style.display !== "none" && style.visibility !== "hidden";
                            });
                            if (visibleButtons[index]) {
                                visibleButtons[index].click();
                            }
                        }, config_1.SELECTORS.POPOVERS.CLOSE_BUTTON, i);
                        await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
                    }
                    try {
                        const gotItButton = await this.page.$(config_1.SELECTORS.POPOVERS.GOT_IT_BUTTON);
                        if (gotItButton) {
                            await this.inputService.moveMouseNaturally(gotItButton);
                            await this.page.click(config_1.SELECTORS.POPOVERS.GOT_IT_BUTTON);
                            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
                        }
                    }
                    catch (e) {
                        console.log("No 'Got it' button found");
                    }
                }
                catch (error) {
                    console.log(`No popovers found on attempt ${attempts + 1}`);
                    keepTrying = false;
                }
                attempts++;
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
            }
            const remainingPopovers = await this.page.$$(config_1.SELECTORS.POPOVERS.CLOSE_BUTTON);
            if (remainingPopovers.length > 0) {
                console.log("Warning: Some popovers might still be present");
            }
            else {
                console.log("All popovers successfully handled");
            }
        }
        catch (error) {
            console.log("Error handling popovers:", error instanceof Error ? error.message : String(error));
        }
    }
    async performLogin(email, password, securityAnswer) {
        try {
            await this.page.goto(config_1.URLS.LOGIN, {
                waitUntil: ["domcontentloaded", "networkidle0"],
            });
            await this.handleCookieConsent();
            // Handle email input
            await this.inputService.handleInput(config_1.SELECTORS.LOGIN.EMAIL_INPUT, email, {
                isPassword: false,
                preTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
                postTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
            });
            // Click continue after email
            const emailContinueButton = await this.page.$(config_1.SELECTORS.LOGIN.EMAIL_CONTINUE_BUTTON);
            if (emailContinueButton) {
                await this.inputService.moveMouseNaturally(emailContinueButton);
                await this.page.click(config_1.SELECTORS.LOGIN.EMAIL_CONTINUE_BUTTON);
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.LONG));
            }
            // Handle password input
            await this.inputService.handleInput(config_1.SELECTORS.LOGIN.PASSWORD_INPUT, password, {
                isPassword: true,
                preTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
                postTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
            });
            // Handle "Keep me logged in" checkbox
            try {
                const keepLoggedInCheckbox = await this.page.$(config_1.SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                if (keepLoggedInCheckbox) {
                    await this.inputService.moveMouseNaturally(keepLoggedInCheckbox);
                    await this.page.click(config_1.SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                    await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
                }
            }
            catch (error) {
                console.log("Could not find or interact with 'Keep me logged in' checkbox");
            }
            // Click continue after password
            const passwordContinueButton = await this.page.$(config_1.SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
            if (passwordContinueButton) {
                await this.inputService.moveMouseNaturally(passwordContinueButton);
                await this.page.click(config_1.SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.LONG));
            }
            // Handle cookie consent again after password verification
            await this.handleCookieConsent();
            await this.handleSecurityQuestion(securityAnswer);
            await this.handleProfileModal();
            await this.handlePopovers();
            const isLoginSuccessful = await (0, auth_service_1.isLoggedIn)(this.page);
            if (isLoginSuccessful) {
                await (0, auth_service_1.saveAuthData)(this.page);
                await this.page.screenshot({ path: "login-success.png" });
                return true;
            }
            throw new errors_1.AuthenticationError("Login verification failed");
        }
        catch (error) {
            console.error("Login flow failed:", error instanceof Error ? error.message : String(error));
            await this.page.screenshot({ path: "login-error.png" });
            throw new errors_1.AuthenticationError(`Login flow failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async attemptStoredLogin() {
        try {
            const authLoaded = await (0, auth_service_1.loadAuthData)(this.page);
            if (!authLoaded) {
                return false;
            }
            console.log("Auth data loaded, attempting to verify login status...");
            return await (0, auth_service_1.isLoggedIn)(this.page);
        }
        catch (error) {
            throw new errors_1.AuthenticationError(`Stored login attempt failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.AuthFlowService = AuthFlowService;
//# sourceMappingURL=auth-flow.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSecurityQuestionModal = handleSecurityQuestionModal;
exports.handleProfileCompletionModal = handleProfileCompletionModal;
const delay_1 = require("../utils/delay");
const config_1 = require("../config");
const input_service_1 = require("../services/input.service");
async function handleSecurityQuestionModal(page, securityAnswer) {
    try {
        const inputService = new input_service_1.InputService(page);
        await page.waitForSelector(config_1.SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, {
            visible: true,
            timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT,
        });
        console.log("Security question detected");
        await inputService.handleInput(config_1.SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, securityAnswer, {
            isPassword: false,
            preTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
            postTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
        });
        try {
            const keepLoggedInCheckbox = await page.$(config_1.SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
            if (keepLoggedInCheckbox) {
                await inputService.moveMouseNaturally(keepLoggedInCheckbox);
                await page.click(config_1.SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
            }
        }
        catch (error) {
            console.log("Could not find or interact with 'Keep me logged in' checkbox");
        }
        const continueButton = await page.$(config_1.SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
        if (continueButton) {
            await inputService.moveMouseNaturally(continueButton);
            await page.click(config_1.SELECTORS.LOGIN.PASSWORD_CONTINUE_BUTTON);
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.LONG));
        }
        return true;
    }
    catch (error) {
        console.log("No security question present or error handling it:", error instanceof Error ? error.message : String(error));
        return false;
    }
}
async function handleProfileCompletionModal(page) {
    try {
        console.log("Checking for profile completion modal...");
        await page.waitForSelector(config_1.SELECTORS.MODALS.PROFILE_MODAL, {
            visible: true,
            timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT,
        });
        const inputService = new input_service_1.InputService(page);
        for (const selector of config_1.SELECTORS.MODALS.CLOSE_BUTTONS) {
            try {
                const closeButton = await page.$(selector);
                if (closeButton) {
                    console.log(`Found close button with selector: ${selector}`);
                    await inputService.moveMouseNaturally(closeButton);
                    await page.click(selector);
                    await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
                    const modalStillVisible = await page.evaluate((modalSel) => {
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
//# sourceMappingURL=modal.handler.js.map
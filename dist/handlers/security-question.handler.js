"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSecurityQuestion = handleSecurityQuestion;
const input_service_1 = require("../services/input.service");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function handleSecurityQuestion(page, securityAnswer) {
    const inputService = new input_service_1.InputService(page);
    try {
        logger_1.logger.info('Starting security question handler');
        // Check if security question exists with a short timeout
        const questionElement = await page.waitForSelector('#login_answer', {
            visible: true,
            timeout: 5000
        }).catch(() => null); // Catch timeout and return null
        // If no security question, return false to continue flow
        if (!questionElement) {
            logger_1.logger.info('No security question found, continuing flow');
            return false;
        }
        // Get question text if available
        const questionText = await page.evaluate(() => {
            const label = document.querySelector('label[for="login_answer"]');
            return label ? label.textContent?.trim() : null;
        });
        if (questionText) {
            logger_1.logger.info({ questionText });
        }
        // Handle security answer input
        await inputService.handleInput('#login_answer', securityAnswer, {
            isPassword: false,
            preTypeDelay: [500, 1000],
            postTypeDelay: [500, 1000]
        });
        // Handle "Remember this device" checkbox
        try {
            const checkboxState = await page.evaluate(() => {
                const checkbox = document.querySelector('span[data-test="checkbox-input"]');
                if (!checkbox)
                    return { exists: false };
                const computedStyle = window.getComputedStyle(checkbox);
                return {
                    exists: true,
                    isVisible: computedStyle.display !== 'none' &&
                        computedStyle.visibility !== 'hidden',
                    isChecked: checkbox.classList.contains('checked')
                };
            });
            logger_1.logger.info({ checkboxState });
            if (checkboxState.exists) {
                await inputService.handleCheckbox('span[data-test="checkbox-input"]', true);
            }
        }
        catch (error) {
            logger_1.logger.warn({
                checkboxError: error instanceof Error ? error.message : String(error)
            });
        }
        // Handle continue button
        const buttonState = await page.evaluate((selector) => {
            const button = document.querySelector(selector);
            if (!button)
                return { exists: false };
            const computedStyle = window.getComputedStyle(button);
            return {
                exists: true,
                isEnabled: !button.hasAttribute('disabled'),
                isVisible: computedStyle.display !== 'none' &&
                    computedStyle.visibility !== 'hidden'
            };
        }, config_1.SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON);
        logger_1.logger.info({ buttonState });
        if (buttonState.exists && buttonState.isEnabled) {
            await inputService.handleButton(config_1.SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON, {
                preClickDelay: [500, 1000],
                postClickDelay: [1000, 2000],
                waitForNavigation: true
            });
        }
        return true;
    }
    catch (error) {
        // Log error but don't throw
        logger_1.logger.warn({
            securityQuestionWarning: {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });
        // Return false to continue flow
        return false;
    }
}
//# sourceMappingURL=security-question.handler.js.map
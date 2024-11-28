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
        // Check if security question exists
        const questionElement = await page.waitForSelector(config_1.SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, {
            visible: true,
            timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT
        }).catch(() => null);
        if (!questionElement) {
            logger_1.logger.info('No security question found');
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
        await inputService.handleInput(config_1.SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, securityAnswer, {
            isPassword: false,
            preTypeDelay: config_1.TIMING.DELAYS.MEDIUM,
            postTypeDelay: config_1.TIMING.DELAYS.MEDIUM
        });
        // Handle "Remember this device" checkbox
        try {
            const checkboxState = await page.evaluate((selector) => {
                const checkbox = document.querySelector(selector);
                if (!checkbox)
                    return { exists: false };
                const style = window.getComputedStyle(checkbox);
                return {
                    exists: true,
                    visible: style.display !== 'none' &&
                        style.visibility !== 'hidden',
                    checked: checkbox.classList.contains('checked')
                };
            }, config_1.SELECTORS.LOGIN.REMEMBER_DEVICE_CHECKBOX);
            logger_1.logger.info({ checkboxState });
            if (checkboxState.exists && checkboxState.visible && !checkboxState.checked) {
                await inputService.handleCheckbox(config_1.SELECTORS.LOGIN.REMEMBER_DEVICE_CHECKBOX, true);
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
            const style = window.getComputedStyle(button);
            return {
                exists: true,
                enabled: !button.hasAttribute('disabled'),
                visible: style.display !== 'none' &&
                    style.visibility !== 'hidden'
            };
        }, config_1.SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON);
        logger_1.logger.info({ buttonState });
        if (buttonState.exists && buttonState.enabled && buttonState.visible) {
            await inputService.handleButton(config_1.SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON, {
                preClickDelay: config_1.TIMING.DELAYS.SHORT,
                postClickDelay: config_1.TIMING.DELAYS.LONG,
                waitForNavigation: true
            });
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error({
            securityQuestionError: {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });
        const pageState = await page.evaluate((selectors) => ({
            url: window.location.href,
            questionInputExists: !!document.querySelector(selectors.SECURITY_QUESTION_INPUT),
            continueButtonExists: !!document.querySelector(selectors.LOGIN_CONTROL_CONTINUE_BUTTON),
            documentReady: document.readyState
        }), config_1.SELECTORS.LOGIN);
        logger_1.logger.error({ pageState });
        return false;
    }
}
//# sourceMappingURL=security-question.handler.js.map
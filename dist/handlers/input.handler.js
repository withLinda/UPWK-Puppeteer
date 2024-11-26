"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInput = handleInput;
exports.fillForm = fillForm;
const errors_1 = require("../utils/errors");
const delay_1 = require("../utils/delay");
const input_utils_1 = require("./shared/input-utils");
const validation_service_1 = require("../services/validation.service");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function handleInput(page, selector, value, options = {}) {
    const { isPassword = false, preTypeDelay = config_1.TIMING.DELAYS.SHORT, postTypeDelay = config_1.TIMING.DELAYS.SHORT } = options;
    logger_1.logger.info({
        inputHandler: {
            selector,
            valueLength: value.length,
            isPassword,
            delays: {
                pre: `${preTypeDelay[0]}-${preTypeDelay[1]}ms`,
                post: `${postTypeDelay[0]}-${postTypeDelay[1]}ms`
            }
        }
    });
    const maxAttempts = 3;
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        try {
            const element = await page.waitForSelector(selector, {
                visible: true,
                timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT
            });
            if (!element) {
                throw new errors_1.InputError('Input element not found');
            }
            const elementState = await page.evaluate((sel) => {
                const input = document.querySelector(sel);
                if (!input)
                    return null;
                const computedStyle = window.getComputedStyle(input);
                const rect = input.getBoundingClientRect();
                return {
                    isVisible: computedStyle.display !== 'none' &&
                        computedStyle.visibility !== 'hidden' &&
                        computedStyle.opacity !== '0',
                    isEnabled: !input.hasAttribute('disabled') &&
                        !input.hasAttribute('readonly'),
                    position: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    },
                    styles: {
                        display: computedStyle.display,
                        visibility: computedStyle.visibility,
                        opacity: computedStyle.opacity,
                        pointerEvents: computedStyle.pointerEvents
                    }
                };
            }, selector);
            logger_1.logger.info({ elementState });
            const isInteractable = await page.evaluate((sel) => {
                const input = document.querySelector(sel);
                if (!input)
                    return false;
                const style = window.getComputedStyle(input);
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0' &&
                    style.pointerEvents !== 'none';
            }, selector);
            if (!isInteractable) {
                throw new errors_1.InputError('Input element is not interactable');
            }
            // Clear the field and get previous value
            const previousValue = await page.evaluate((sel) => {
                const input = document.querySelector(sel);
                if (input) {
                    const prev = input.value;
                    input.value = "";
                    const event = new Event("input", { bubbles: false });
                    input.dispatchEvent(event);
                    return prev;
                }
                return "";
            }, selector);
            // Log field clearing outside of evaluate
            logger_1.logger.info({ fieldCleared: { previous: previousValue } });
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(preTypeDelay));
            await (0, input_utils_1.moveMouseNaturally)(page, element);
            await page.click(selector);
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.SHORT));
            await (0, input_utils_1.typeNaturally)(page, value, isPassword);
            try {
                await validation_service_1.ValidationService.verifyInputValue(page, selector, value);
                await page.evaluate((sel, val) => {
                    const input = document.querySelector(sel);
                    if (input) {
                        input.value = val;
                        const inputEvent = new Event("input", { bubbles: true });
                        const changeEvent = new Event("change", { bubbles: true });
                        input.dispatchEvent(inputEvent);
                        input.dispatchEvent(changeEvent);
                    }
                }, selector, value);
                await (0, delay_1.delay)(500);
                return true;
            }
            catch (verifyError) {
                logger_1.logger.warn({
                    verificationFailed: {
                        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
                        attempt: attempts
                    }
                });
                // Fallback method
                await page.evaluate((sel, text) => {
                    const input = document.querySelector(sel);
                    if (input) {
                        input.value = text;
                        input.focus();
                        const inputEvent = new Event("input", { bubbles: true });
                        const changeEvent = new Event("change", { bubbles: true });
                        input.dispatchEvent(inputEvent);
                        input.dispatchEvent(changeEvent);
                    }
                }, selector, value);
                await (0, delay_1.delay)(1000);
                try {
                    await validation_service_1.ValidationService.verifyInputValue(page, selector, value);
                    return true;
                }
                catch (fallbackError) {
                    logger_1.logger.warn({
                        fallbackFailed: {
                            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
                            attempt: attempts
                        }
                    });
                }
            }
            if (attempts < maxAttempts) {
                await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
            }
        }
        catch (error) {
            logger_1.logger.error({
                inputError: {
                    attempt: attempts,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
            const pageState = await page.evaluate((sel) => {
                const input = document.querySelector(sel);
                return {
                    exists: !!input,
                    value: input instanceof HTMLInputElement ? input.value : null,
                    isVisible: input ? window.getComputedStyle(input).display !== 'none' : false
                };
            }, selector);
            logger_1.logger.error({ pageState });
            if (attempts >= maxAttempts) {
                throw new errors_1.InputError(`Input handling failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`);
            }
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
        }
    }
    throw new errors_1.InputError(`Input handling failed after ${maxAttempts} attempts`);
}
async function fillForm(page, formData) {
    logger_1.logger.info({
        formFill: {
            fields: formData.length,
            selectors: formData.map(f => f.selector)
        }
    });
    for (const { selector, value, isPassword } of formData) {
        try {
            await handleInput(page, selector, value, { isPassword });
        }
        catch (error) {
            logger_1.logger.error({
                formFillError: {
                    selector,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
            throw new errors_1.InputError(`Form fill failed at selector ${selector}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return true;
}
//# sourceMappingURL=input.handler.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleButton = handleButton;
const errors_1 = require("../utils/errors");
const delay_1 = require("../utils/delay");
const input_utils_1 = require("./shared/input-utils");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function handleButton(page, selector, options = {}) {
    const { preClickDelay = config_1.TIMING.DELAYS.SHORT, postClickDelay = config_1.TIMING.DELAYS.SHORT, waitForNavigation = false, requiresFormValidation = false } = options;
    logger_1.logger.info({
        buttonInteraction: {
            selector,
            options: {
                waitForNavigation,
                requiresFormValidation
            }
        }
    });
    const maxAttempts = 3;
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        try {
            const button = await page.waitForSelector(selector, {
                visible: true,
                timeout: config_1.TIMING.ELEMENT_WAIT_TIMEOUT
            });
            if (!button) {
                throw new errors_1.InputError('Button element not found');
            }
            const buttonState = await page.evaluate((sel) => {
                const btn = document.querySelector(sel);
                if (!btn)
                    return null;
                const computedStyle = window.getComputedStyle(btn);
                const rect = btn.getBoundingClientRect();
                return {
                    isVisible: computedStyle.display !== 'none' &&
                        computedStyle.visibility !== 'hidden' &&
                        computedStyle.opacity !== '0',
                    isEnabled: !btn.hasAttribute('disabled') &&
                        !btn.hasAttribute('aria-disabled'),
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
            logger_1.logger.info({ buttonState });
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(preClickDelay));
            await (0, input_utils_1.moveMouseNaturally)(page, button);
            if (waitForNavigation) {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
                    page.click(selector)
                ]);
            }
            else {
                await page.click(selector);
            }
            const postClickState = await page.evaluate((sel) => {
                const btn = document.querySelector(sel);
                if (!btn)
                    return null;
                return {
                    exists: true,
                    isEnabled: !btn.hasAttribute('disabled'),
                    isVisible: window.getComputedStyle(btn).display !== 'none'
                };
            }, selector);
            logger_1.logger.info({ postClickState });
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(postClickDelay));
            return true;
        }
        catch (error) {
            logger_1.logger.error(error);
            if (attempts >= maxAttempts) {
                throw new errors_1.InputError(`Button interaction failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`);
            }
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
        }
    }
    throw new errors_1.InputError(`Button interaction failed after ${maxAttempts} attempts`);
}
//# sourceMappingURL=button.handler.js.map
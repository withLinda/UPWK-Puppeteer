"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePopovers = handlePopovers;
const input_service_1 = require("../services/input.service");
const delay_1 = require("../utils/delay");
const config_1 = require("../config");
const input_utils_1 = require("./shared/input-utils");
const logger_1 = require("../utils/logger");
async function handlePopovers(page) {
    const inputService = new input_service_1.InputService(page);
    const maxAttempts = 3;
    let attempts = 0;
    let keepTrying = true;
    logger_1.logger.info('Starting popover handler');
    try {
        while (keepTrying && attempts < maxAttempts) {
            attempts++;
            try {
                const popoverState = await page.evaluate(() => {
                    const popovers = document.querySelectorAll('[data-cy="nav-popover"]');
                    return {
                        count: popovers.length,
                        visible: Array.from(popovers).filter(p => {
                            const style = window.getComputedStyle(p);
                            return style.display !== 'none' &&
                                style.visibility !== 'hidden' &&
                                style.opacity !== '0';
                        }).length
                    };
                });
                logger_1.logger.info({
                    attempt: attempts,
                    popoverState
                });
                const closeButtonsInfo = await page.$$eval(config_1.SELECTORS.POPOVERS.CLOSE_BUTTON, (buttons) => buttons.map(btn => {
                    const style = window.getComputedStyle(btn);
                    return {
                        visible: style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            style.opacity !== '0',
                        position: btn.getBoundingClientRect(),
                        disabled: btn.hasAttribute('disabled')
                    };
                }));
                logger_1.logger.info({ closeButtonsInfo });
                const visibleButtons = closeButtonsInfo.filter(btn => btn.visible);
                if (visibleButtons.length === 0) {
                    keepTrying = false;
                    continue;
                }
                // Process each close button
                for (let i = 0; i < visibleButtons.length; i++) {
                    logger_1.logger.info({
                        processingButton: {
                            index: i + 1,
                            total: visibleButtons.length
                        }
                    });
                    const buttonSelector = await page.evaluate((index) => {
                        const buttons = Array.from(document.querySelectorAll('[data-cy="nav-popover-close-btn"]'))
                            .filter(btn => {
                            const style = window.getComputedStyle(btn);
                            return style.display !== 'none' &&
                                style.visibility !== 'hidden' &&
                                style.opacity !== '0';
                        });
                        if (buttons[index]) {
                            return (0, input_utils_1.generateUniqueSelector)(buttons[index]);
                        }
                        return null;
                    }, i);
                    if (buttonSelector) {
                        try {
                            await inputService.handleButton(buttonSelector, {
                                preClickDelay: config_1.TIMING.DELAYS.SHORT,
                                postClickDelay: config_1.TIMING.DELAYS.MEDIUM
                            });
                        }
                        catch (error) {
                            logger_1.logger.error({
                                buttonError: {
                                    index: i + 1,
                                    selector: buttonSelector,
                                    error: error instanceof Error ? error.message : String(error)
                                }
                            });
                        }
                    }
                }
                // Check for "Got it" button
                const gotItButtonState = await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (!button)
                        return { exists: false };
                    const style = window.getComputedStyle(button);
                    return {
                        exists: true,
                        visible: style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            style.opacity !== '0',
                        enabled: !button.hasAttribute('disabled')
                    };
                }, config_1.SELECTORS.POPOVERS.GOT_IT_BUTTON);
                logger_1.logger.info({ gotItButtonState });
                if (gotItButtonState.exists && gotItButtonState.visible) {
                    await inputService.handleButton(config_1.SELECTORS.POPOVERS.GOT_IT_BUTTON, {
                        preClickDelay: config_1.TIMING.DELAYS.SHORT,
                        postClickDelay: config_1.TIMING.DELAYS.MEDIUM
                    });
                }
            }
            catch (error) {
                logger_1.logger.info({
                    noPopovers: {
                        attempt: attempts,
                        error: error instanceof Error ? error.message : String(error)
                    }
                });
                keepTrying = false;
            }
            await (0, delay_1.delay)((0, delay_1.getRandomDelayFromTuple)(config_1.TIMING.DELAYS.MEDIUM));
        }
        // Final check for remaining popovers
        const finalState = await page.evaluate((selector) => {
            const popovers = document.querySelectorAll(selector);
            return Array.from(popovers).map(p => ({
                visible: window.getComputedStyle(p).display !== 'none',
                position: p.getBoundingClientRect(),
                attributes: Array.from(p.attributes).map(attr => ({
                    name: attr.name,
                    value: attr.value
                }))
            }));
        }, '[data-cy="nav-popover"]');
        const remainingVisible = finalState.filter(p => p.visible).length;
        logger_1.logger.info({
            finalCheck: {
                remainingPopovers: remainingVisible,
                states: finalState
            }
        });
    }
    catch (error) {
        logger_1.logger.error({
            popoverError: {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });
        const pageState = await page.evaluate(() => ({
            url: window.location.href,
            popovers: document.querySelectorAll('[data-cy="nav-popover"]').length,
            closeButtons: document.querySelectorAll('[data-cy="nav-popover-close-btn"]').length,
            documentReady: document.readyState
        }));
        logger_1.logger.error({ pageState });
    }
}
//# sourceMappingURL=popup.handler.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleProfileCompletionModal = handleProfileCompletionModal;
const input_service_1 = require("../services/input.service");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
async function handleProfileCompletionModal(page) {
    const inputService = new input_service_1.InputService(page);
    try {
        logger_1.logger.info('Starting profile completion modal handler');
        const modalState = await page.evaluate((selector) => {
            const modal = document.querySelector(selector);
            if (!modal)
                return { exists: false };
            const style = window.getComputedStyle(modal);
            return {
                exists: true,
                visible: style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0',
                position: modal.getBoundingClientRect(),
                styles: {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity,
                    zIndex: style.zIndex
                }
            };
        }, config_1.SELECTORS.MODALS.PROFILE_MODAL);
        logger_1.logger.info({ modalState });
        await page.waitForSelector(config_1.SELECTORS.MODALS.PROFILE_MODAL, {
            visible: true,
            timeout: 5000
        });
        // Try each close button selector
        for (const selector of config_1.SELECTORS.MODALS.CLOSE_BUTTONS) {
            try {
                const buttonState = await page.evaluate((sel) => {
                    const button = document.querySelector(sel);
                    if (!button)
                        return { exists: false };
                    const style = window.getComputedStyle(button);
                    return {
                        exists: true,
                        visible: style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            style.opacity !== '0',
                        enabled: !button.hasAttribute('disabled'),
                        position: button.getBoundingClientRect()
                    };
                }, selector);
                logger_1.logger.info({
                    closeButton: {
                        selector,
                        state: buttonState
                    }
                });
                if (buttonState.exists && buttonState.visible) {
                    await inputService.handleButton(selector, {
                        preClickDelay: config_1.TIMING.DELAYS.SHORT,
                        postClickDelay: config_1.TIMING.DELAYS.MEDIUM
                    });
                    // Verify modal closure
                    const modalStillVisible = await page.evaluate((modalSel) => {
                        const modal = document.querySelector(modalSel);
                        if (!modal)
                            return false;
                        const style = window.getComputedStyle(modal);
                        return style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            style.opacity !== '0';
                    }, config_1.SELECTORS.MODALS.PROFILE_MODAL);
                    logger_1.logger.info({ modalStillVisible });
                    if (!modalStillVisible) {
                        break;
                    }
                }
            }
            catch (err) {
                logger_1.logger.warn({
                    closeButtonError: {
                        selector,
                        error: err instanceof Error ? err.message : String(err)
                    }
                });
            }
        }
    }
    catch (error) {
        logger_1.logger.error({
            modalError: {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });
        const pageState = await page.evaluate(() => ({
            url: window.location.href,
            modalExists: !!document.querySelector(config_1.SELECTORS.MODALS.PROFILE_MODAL),
            closeButtonsCount: config_1.SELECTORS.MODALS.CLOSE_BUTTONS.map(sel => document.querySelectorAll(sel).length),
            documentReady: document.readyState,
            visibleModals: Array.from(document.querySelectorAll('div[role="dialog"]')).map(modal => ({
                visible: window.getComputedStyle(modal).display !== 'none',
                classes: Array.from(modal.classList)
            }))
        }));
        logger_1.logger.error({ pageState });
    }
}
//# sourceMappingURL=modal.handler.js.map
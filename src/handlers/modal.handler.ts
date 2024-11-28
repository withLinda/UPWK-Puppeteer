import { Page } from 'puppeteer';
import { InputService } from '../services/input.service';
import { SELECTORS, TIMING } from '../config';
import { logger } from '../utils/logger';

export async function handleProfileCompletionModal(page: Page): Promise<void> {
    const inputService = new InputService(page);

    try {
        logger.info('Starting profile completion modal handler');

        const modalState = await page.evaluate((selector) => {
            const modal = document.querySelector(selector);
            if (!modal) return { exists: false };

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
        }, SELECTORS.MODALS.PROFILE_MODAL);

        logger.info({ modalState });

        await page.waitForSelector(SELECTORS.MODALS.PROFILE_MODAL, {
            visible: true,
            timeout: 5000
        });

        // Try each close button selector
        for (const selector of SELECTORS.MODALS.CLOSE_BUTTONS) {
            try {
                const buttonState = await page.evaluate((sel) => {
                    const button = document.querySelector(sel);
                    if (!button) return { exists: false };

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

                logger.info({
                    closeButton: {
                        selector,
                        state: buttonState
                    }
                });

                if (buttonState.exists && buttonState.visible) {
                    await inputService.handleButton(selector, {
                        preClickDelay: TIMING.DELAYS.SHORT,
                        postClickDelay: TIMING.DELAYS.MEDIUM
                    });

                    // Verify modal closure
                    const modalStillVisible = await page.evaluate((modalSel: string): boolean => {
                        const modal = document.querySelector(modalSel);
                        if (!modal) return false;
                        const style = window.getComputedStyle(modal);
                        return style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            style.opacity !== '0';
                    }, SELECTORS.MODALS.PROFILE_MODAL);

                    logger.info({ modalStillVisible });

                    if (!modalStillVisible) {
                        break;
                    }
                }
            } catch (err) {
                logger.warn({
                    closeButtonError: {
                        selector,
                        error: err instanceof Error ? err.message : String(err)
                    }
                });
            }
        }

    } catch (error) {
        logger.error({
            modalError: {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });

        const pageState = await page.evaluate(() => ({
            url: window.location.href,
            modalExists: !!document.querySelector(SELECTORS.MODALS.PROFILE_MODAL),
            closeButtonsCount: SELECTORS.MODALS.CLOSE_BUTTONS.map(
                sel => document.querySelectorAll(sel).length
            ),
            documentReady: document.readyState,
            visibleModals: Array.from(document.querySelectorAll('div[role="dialog"]')).map(modal => ({
                visible: window.getComputedStyle(modal).display !== 'none',
                classes: Array.from(modal.classList)
            }))
        }));

        logger.error({ pageState });
    }
}

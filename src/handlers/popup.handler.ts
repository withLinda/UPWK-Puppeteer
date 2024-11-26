import { Page } from 'puppeteer';
import { InputService } from '../services/input.service';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
import { SELECTORS, TIMING } from '../config';
import { generateUniqueSelector } from './shared/input-utils';
import { logger } from '../utils/logger';

export async function handlePopovers(page: Page): Promise<void> {
    const inputService = new InputService(page);
    const maxAttempts = 3;
    let attempts = 0;
    let keepTrying = true;

    logger.info('Starting popover handler');

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

                logger.info({
                    attempt: attempts,
                    popoverState
                });

                const closeButtonsInfo = await page.$$eval(
                    SELECTORS.POPOVERS.CLOSE_BUTTON,
                    (buttons) => buttons.map(btn => {
                        const style = window.getComputedStyle(btn);
                        return {
                            visible: style.display !== 'none' &&
                                style.visibility !== 'hidden' &&
                                style.opacity !== '0',
                            position: btn.getBoundingClientRect(),
                            disabled: btn.hasAttribute('disabled')
                        };
                    })
                );

                logger.info({ closeButtonsInfo });

                const visibleButtons = closeButtonsInfo.filter(btn => btn.visible);

                if (visibleButtons.length === 0) {
                    keepTrying = false;
                    continue;
                }

                // Process each close button
                for (let i = 0; i < visibleButtons.length; i++) {
                    logger.info({
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
                            return generateUniqueSelector(buttons[index]);
                        }
                        return null;
                    }, i);

                    if (buttonSelector) {
                        try {
                            await inputService.handleButton(buttonSelector, {
                                preClickDelay: TIMING.DELAYS.SHORT,
                                postClickDelay: TIMING.DELAYS.MEDIUM
                            });
                        } catch (error) {
                            logger.error({
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
                    if (!button) return { exists: false };

                    const style = window.getComputedStyle(button);
                    return {
                        exists: true,
                        visible: style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            style.opacity !== '0',
                        enabled: !button.hasAttribute('disabled')
                    };
                }, SELECTORS.POPOVERS.GOT_IT_BUTTON);

                logger.info({ gotItButtonState });

                if (gotItButtonState.exists && gotItButtonState.visible) {
                    await inputService.handleButton(SELECTORS.POPOVERS.GOT_IT_BUTTON, {
                        preClickDelay: TIMING.DELAYS.SHORT,
                        postClickDelay: TIMING.DELAYS.MEDIUM
                    });
                }

            } catch (error) {
                logger.info({
                    noPopovers: {
                        attempt: attempts,
                        error: error instanceof Error ? error.message : String(error)
                    }
                });
                keepTrying = false;
            }

            await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
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

        logger.info({
            finalCheck: {
                remainingPopovers: remainingVisible,
                states: finalState
            }
        });

    } catch (error) {
        logger.error({
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

        logger.error({ pageState });
    }
}

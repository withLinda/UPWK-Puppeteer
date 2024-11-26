import { Page } from 'puppeteer';
import { InputService } from '../services/input.service';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
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

export async function handleSecurityQuestionModal(
    page: Page,
    securityAnswer: string
): Promise<boolean> {
    const inputService = new InputService(page);

    try {
        logger.info('Starting security question modal handler');

        const modalState = await page.evaluate(() => {
            const modal = document.querySelector('div[role="dialog"]');
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
        });

        logger.info({ modalState });

        const questionInput = await page.waitForSelector(SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, {
            visible: true,
            timeout: 5000
        });

        if (!questionInput) {
            logger.info('Security question input not found');
            return false;
        }

        // Get question text if available
        const questionText = await page.evaluate(() => {
            const label = document.querySelector('label[for="login_answer"]');
            return label ? label.textContent?.trim() : null;
        });

        if (questionText) {
            logger.info({ questionText });
        }

        await inputService.handleInput(SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, securityAnswer, {
            isPassword: false,
            preTypeDelay: TIMING.DELAYS.MEDIUM,
            postTypeDelay: TIMING.DELAYS.MEDIUM
        });

        // Handle "Keep me logged in" checkbox
        try {
            const checkboxState = await page.evaluate(() => {
                const checkbox = document.querySelector(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX);
                if (!checkbox) return { exists: false };

                const style = window.getComputedStyle(checkbox);
                return {
                    exists: true,
                    visible: style.display !== 'none' &&
                        style.visibility !== 'hidden',
                    checked: checkbox.classList.contains('checked')
                };
            });

            logger.info({ checkboxState });

            if (checkboxState.exists) {
                await inputService.handleCheckbox(SELECTORS.LOGIN.KEEP_LOGGED_IN_CHECKBOX, true);
            }
        } catch (error) {
            logger.warn({
                checkboxError: error instanceof Error ? error.message : String(error)
            });
        }

        // Handle continue button
        const buttonState = await page.evaluate((selector) => {
            const button = document.querySelector(selector);
            if (!button) return { exists: false };

            const style = window.getComputedStyle(button);
            return {
                exists: true,
                enabled: !button.hasAttribute('disabled'),
                visible: style.display !== 'none' &&
                    style.visibility !== 'hidden'
            };
        }, SELECTORS.LOGIN.LOGIN_PASSWORD_CONTINUE_BUTTON);

        logger.info({ buttonState });

        await inputService.handleButton(SELECTORS.LOGIN.LOGIN_PASSWORD_CONTINUE_BUTTON, {
            preClickDelay: TIMING.DELAYS.SHORT,
            postClickDelay: TIMING.DELAYS.LONG,
            waitForNavigation: true
        });

        return true;
    } catch (error) {
        logger.error({
            modalError: {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });

        const pageState = await page.evaluate(() => ({
            url: window.location.href,
            questionInputExists: !!document.querySelector(SELECTORS.LOGIN.SECURITY_QUESTION_INPUT),
            continueButtonExists: !!document.querySelector(SELECTORS.LOGIN.LOGIN_PASSWORD_CONTINUE_BUTTON),
            documentReady: document.readyState,
            visibleModals: Array.from(document.querySelectorAll('div[role="dialog"]')).map(modal => ({
                visible: window.getComputedStyle(modal).display !== 'none',
                classes: Array.from(modal.classList)
            }))
        }));

        logger.error({ pageState });
        return false;
    }
}

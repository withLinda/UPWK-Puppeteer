import { Page } from 'puppeteer';
import { InputService } from '../services/input.service';
import { SELECTORS, TIMING } from '../config';
import { logger } from '../utils/logger';

export async function handleSecurityQuestion(
    page: Page,
    securityAnswer: string
): Promise<boolean> {
    const inputService = new InputService(page);

    try {
        logger.info('Starting security question handler');

        // Check if security question exists
        const questionElement = await page.waitForSelector(SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, {
            visible: true,
            timeout: TIMING.ELEMENT_WAIT_TIMEOUT
        }).catch(() => null);

        if (!questionElement) {
            logger.info('No security question found');
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

        // Handle security answer input
        await inputService.handleInput(SELECTORS.LOGIN.SECURITY_QUESTION_INPUT, securityAnswer, {
            isPassword: false,
            preTypeDelay: TIMING.DELAYS.MEDIUM,
            postTypeDelay: TIMING.DELAYS.MEDIUM
        });

        // Handle "Remember this device" checkbox
        try {
            const checkboxState = await page.evaluate((selector) => {
                const checkbox = document.querySelector(selector);
                if (!checkbox) return { exists: false };

                const style = window.getComputedStyle(checkbox);
                return {
                    exists: true,
                    visible: style.display !== 'none' &&
                        style.visibility !== 'hidden',
                    checked: checkbox.classList.contains('checked')
                };
            }, SELECTORS.LOGIN.REMEMBER_DEVICE_CHECKBOX);

            logger.info({ checkboxState });

            if (checkboxState.exists && checkboxState.visible && !checkboxState.checked) {
                await inputService.handleCheckbox(SELECTORS.LOGIN.REMEMBER_DEVICE_CHECKBOX, true);
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
        }, SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON);

        logger.info({ buttonState });

        if (buttonState.exists && buttonState.enabled && buttonState.visible) {
            await inputService.handleButton(SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON, {
                preClickDelay: TIMING.DELAYS.SHORT,
                postClickDelay: TIMING.DELAYS.LONG,
                waitForNavigation: true
            });
        }

        return true;
    } catch (error) {
        logger.error({
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
        }), SELECTORS.LOGIN);

        logger.error({ pageState });

        return false;
    }
}

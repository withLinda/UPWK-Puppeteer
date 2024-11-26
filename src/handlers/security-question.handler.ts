import { Page } from 'puppeteer';
import { InputService } from '../services/input.service';
import { SELECTORS } from '../config';
import { logger } from '../utils/logger';

export async function handleSecurityQuestion(
    page: Page,
    securityAnswer: string
): Promise<boolean> {
    const inputService = new InputService(page);

    try {
        logger.info('Starting security question handler');

        // Check if security question exists with a short timeout
        const questionElement = await page.waitForSelector('#login_answer', {
            visible: true,
            timeout: 5000
        }).catch(() => null); // Catch timeout and return null

        // If no security question, return false to continue flow
        if (!questionElement) {
            logger.info('No security question found, continuing flow');
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
        await inputService.handleInput('#login_answer', securityAnswer, {
            isPassword: false,
            preTypeDelay: [500, 1000],
            postTypeDelay: [500, 1000]
        });

        // Handle "Remember this device" checkbox
        try {
            const checkboxState = await page.evaluate(() => {
                const checkbox = document.querySelector('span[data-test="checkbox-input"]');
                if (!checkbox) return { exists: false };

                const computedStyle = window.getComputedStyle(checkbox);
                return {
                    exists: true,
                    isVisible: computedStyle.display !== 'none' &&
                        computedStyle.visibility !== 'hidden',
                    isChecked: checkbox.classList.contains('checked')
                };
            });

            logger.info({ checkboxState });

            if (checkboxState.exists) {
                await inputService.handleCheckbox('span[data-test="checkbox-input"]', true);
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

            const computedStyle = window.getComputedStyle(button);
            return {
                exists: true,
                isEnabled: !button.hasAttribute('disabled'),
                isVisible: computedStyle.display !== 'none' &&
                    computedStyle.visibility !== 'hidden'
            };
        }, SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON);

        logger.info({ buttonState });

        if (buttonState.exists && buttonState.isEnabled) {
            await inputService.handleButton(SELECTORS.LOGIN.LOGIN_CONTROL_CONTINUE_BUTTON, {
                preClickDelay: [500, 1000],
                postClickDelay: [1000, 2000],
                waitForNavigation: true
            });
        }

        return true;
    } catch (error) {
        // Log error but don't throw
        logger.warn({
            securityQuestionWarning: {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }
        });

        // Return false to continue flow
        return false;
    }
}

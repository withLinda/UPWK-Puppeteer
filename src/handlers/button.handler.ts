import { Page } from 'puppeteer';
import { InputError } from '../utils/errors';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
import { moveMouseNaturally } from './shared/input-utils';
import { TIMING } from '../config';
import { logger } from '../utils/logger';

export interface ButtonOptions {
    preClickDelay?: [number, number];
    postClickDelay?: [number, number];
    waitForNavigation?: boolean;
    requiresFormValidation?: boolean;
}

export async function handleButton(
    page: Page,
    selector: string,
    options: ButtonOptions = {}
): Promise<boolean> {
    const {
        preClickDelay = TIMING.DELAYS.SHORT,
        postClickDelay = TIMING.DELAYS.SHORT,
        waitForNavigation = false,
        requiresFormValidation = false
    } = options;

    logger.info({
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
                timeout: TIMING.ELEMENT_WAIT_TIMEOUT
            });

            if (!button) {
                throw new InputError('Button element not found');
            }

            const buttonState = await page.evaluate((sel: string) => {
                const btn = document.querySelector(sel);
                if (!btn) return null;

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

            logger.info({ buttonState });

            await delay(getRandomDelayFromTuple(preClickDelay));
            await moveMouseNaturally(page, button);

            if (waitForNavigation) {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
                    page.click(selector)
                ]);
            } else {
                await page.click(selector);
            }

            const postClickState = await page.evaluate((sel: string) => {
                const btn = document.querySelector(sel);
                if (!btn) return null;

                return {
                    exists: true,
                    isEnabled: !btn.hasAttribute('disabled'),
                    isVisible: window.getComputedStyle(btn).display !== 'none'
                };
            }, selector);

            logger.info({ postClickState });

            await delay(getRandomDelayFromTuple(postClickDelay));
            return true;

        } catch (error) {
            logger.error(error);

            if (attempts >= maxAttempts) {
                throw new InputError(
                    `Button interaction failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`
                );
            }

            await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
        }
    }

    throw new InputError(`Button interaction failed after ${maxAttempts} attempts`);
}

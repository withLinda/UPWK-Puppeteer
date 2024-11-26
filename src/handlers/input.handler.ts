import { Page } from 'puppeteer';
import { InputError } from '../utils/errors';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
import { moveMouseNaturally, typeNaturally } from './shared/input-utils';
import { ValidationService } from '../services/validation.service';
import { TIMING } from '../config';
import { logger } from '../utils/logger';

export interface InputOptions {
    isPassword?: boolean;
    preTypeDelay?: [number, number];
    postTypeDelay?: [number, number];
}

export async function handleInput(
    page: Page,
    selector: string,
    value: string,
    options: InputOptions = {}
): Promise<boolean> {
    const {
        isPassword = false,
        preTypeDelay = TIMING.DELAYS.SHORT,
        postTypeDelay = TIMING.DELAYS.SHORT
    } = options;

    logger.info({
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
                timeout: TIMING.ELEMENT_WAIT_TIMEOUT
            });

            if (!element) {
                throw new InputError('Input element not found');
            }

            const elementState = await page.evaluate((sel: string) => {
                const input = document.querySelector(sel);
                if (!input) return null;

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

            logger.info({ elementState });

            const isInteractable = await page.evaluate((sel: string): boolean => {
                const input = document.querySelector(sel);
                if (!input) return false;
                const style = window.getComputedStyle(input);
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0' &&
                    style.pointerEvents !== 'none';
            }, selector);

            if (!isInteractable) {
                throw new InputError('Input element is not interactable');
            }

            // Clear the field and get previous value
            const previousValue = await page.evaluate((sel: string): string => {
                const input = document.querySelector(sel) as HTMLInputElement;
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
            logger.info({ fieldCleared: { previous: previousValue } });

            await delay(getRandomDelayFromTuple(preTypeDelay));
            await moveMouseNaturally(page, element);
            await page.click(selector);
            await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));

            await typeNaturally(page, value, isPassword);

            try {
                await ValidationService.verifyInputValue(page, selector, value);

                await page.evaluate((sel: string, val: string): void => {
                    const input = document.querySelector(sel) as HTMLInputElement;
                    if (input) {
                        input.value = val;
                        const inputEvent = new Event("input", { bubbles: true });
                        const changeEvent = new Event("change", { bubbles: true });
                        input.dispatchEvent(inputEvent);
                        input.dispatchEvent(changeEvent);
                    }
                }, selector, value);

                await delay(500);
                return true;

            } catch (verifyError) {
                logger.warn({
                    verificationFailed: {
                        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
                        attempt: attempts
                    }
                });

                // Fallback method
                await page.evaluate((sel: string, text: string): void => {
                    const input = document.querySelector(sel) as HTMLInputElement;
                    if (input) {
                        input.value = text;
                        input.focus();
                        const inputEvent = new Event("input", { bubbles: true });
                        const changeEvent = new Event("change", { bubbles: true });
                        input.dispatchEvent(inputEvent);
                        input.dispatchEvent(changeEvent);
                    }
                }, selector, value);

                await delay(1000);

                try {
                    await ValidationService.verifyInputValue(page, selector, value);
                    return true;
                } catch (fallbackError) {
                    logger.warn({
                        fallbackFailed: {
                            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
                            attempt: attempts
                        }
                    });
                }
            }

            if (attempts < maxAttempts) {
                await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
            }

        } catch (error) {
            logger.error({
                inputError: {
                    attempt: attempts,
                    error: error instanceof Error ? error.message : String(error)
                }
            });

            const pageState = await page.evaluate((sel: string) => {
                const input = document.querySelector(sel);
                return {
                    exists: !!input,
                    value: input instanceof HTMLInputElement ? input.value : null,
                    isVisible: input ? window.getComputedStyle(input).display !== 'none' : false
                };
            }, selector);

            logger.error({ pageState });

            if (attempts >= maxAttempts) {
                throw new InputError(
                    `Input handling failed after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`
                );
            }

            await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
        }
    }

    throw new InputError(`Input handling failed after ${maxAttempts} attempts`);
}

export async function fillForm(
    page: Page,
    formData: Array<{ selector: string; value: string; isPassword?: boolean }>
): Promise<boolean> {
    logger.info({
        formFill: {
            fields: formData.length,
            selectors: formData.map(f => f.selector)
        }
    });

    for (const { selector, value, isPassword } of formData) {
        try {
            await handleInput(page, selector, value, { isPassword });
        } catch (error) {
            logger.error({
                formFillError: {
                    selector,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
            throw new InputError(
                `Form fill failed at selector ${selector}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    return true;
}

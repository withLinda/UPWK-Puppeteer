import { Page } from 'puppeteer';
import { ValidationError } from '../utils/errors';
import { delay } from '../utils/delay';
import { logger } from '../utils/logger';

export const INPUT_CONFIG = {
    VERIFICATION_TIMEOUT: 5000  // 5 seconds timeout for input verification
};

export class ValidationService {
    /**
     * Verifies if the input value matches the expected value
     * @param page Puppeteer Page instance
     * @param selector Element selector to verify
     * @param expectedValue The value we expect to see in the input
     * @param timeout Maximum time to wait for verification (default 5000ms)
     * @returns Promise<boolean> True if input matches expected value, false otherwise
     */
    static async verifyInputValue(
        page: Page,
        selector: string,
        expectedValue: string,
        timeout: number = INPUT_CONFIG.VERIFICATION_TIMEOUT
    ): Promise<boolean> {
        logger.info({
            verification: {
                selector,
                expectedLength: expectedValue.length,
                timeout
            }
        });

        const startTime = Date.now();
        let lastValue = "";
        let verificationAttempts = 0;

        // Get initial input state
        const initialState = await page.evaluate((sel: string) => {
            const input = document.querySelector(sel);
            if (!input) return { exists: false };

            const style = window.getComputedStyle(input);
            const rect = input.getBoundingClientRect();

            return {
                exists: true,
                value: (input as HTMLInputElement).value,
                type: input.getAttribute('type'),
                styles: {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity,
                    position: style.position
                },
                position: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                },
                attributes: {
                    disabled: input.hasAttribute('disabled'),
                    readonly: input.hasAttribute('readonly'),
                    required: input.hasAttribute('required'),
                    maxLength: input.getAttribute('maxlength'),
                    minLength: input.getAttribute('minlength'),
                    pattern: input.getAttribute('pattern')
                }
            };
        }, selector);

        logger.info({ initialState });

        if (!initialState.exists) {
            throw new ValidationError('Input element not found during verification');
        }

        while (Date.now() - startTime < timeout) {
            verificationAttempts++;

            const inputState = await page.evaluate((sel: string) => {
                const input = document.querySelector(sel) as HTMLInputElement | null;
                if (!input) return null;

                return {
                    value: input.value,
                    valueLength: input.value.length,
                    selectionStart: input.selectionStart,
                    selectionEnd: input.selectionEnd,
                    focused: document.activeElement === input,
                    validity: input.validity ? {
                        valid: input.validity.valid,
                        valueMissing: input.validity.valueMissing,
                        typeMismatch: input.validity.typeMismatch,
                        patternMismatch: input.validity.patternMismatch,
                        tooLong: input.validity.tooLong,
                        tooShort: input.validity.tooShort
                    } : null
                };
            }, selector);

            if (!inputState) {
                throw new ValidationError('Input element disappeared during verification');
            }

            if (inputState.value === expectedValue) {
                logger.info({
                    verificationSuccess: {
                        attempts: verificationAttempts,
                        timeTaken: `${Date.now() - startTime}ms`
                    }
                });
                return true;
            }

            if (inputState.value !== lastValue) {
                logger.info({
                    valueChange: {
                        previousLength: lastValue.length,
                        currentLength: inputState.value.length,
                        expectedLength: expectedValue.length,
                        difference: Math.abs(inputState.value.length - expectedValue.length)
                    }
                });
                lastValue = inputState.value;
            }

            await delay(100);
        }

        // Get final state before throwing error
        const finalState = await page.evaluate((sel: string) => {
            const input = document.querySelector(sel) as HTMLInputElement | null;
            if (!input) return null;

            const style = window.getComputedStyle(input);
            return {
                value: input.value,
                valueLength: input.value.length,
                focused: document.activeElement === input,
                styles: {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity
                },
                validity: input.validity ? {
                    valid: input.validity.valid,
                    valueMissing: input.validity.valueMissing,
                    typeMismatch: input.validity.typeMismatch,
                    patternMismatch: input.validity.patternMismatch
                } : null
            };
        }, selector);

        logger.error({
            verificationTimeout: {
                lastLength: lastValue.length,
                expectedLength: expectedValue.length,
                attempts: verificationAttempts,
                timeElapsed: `${Date.now() - startTime}ms`,
                finalState
            }
        });

        throw new ValidationError(
            `Input verification failed: Value does not match expected (Current: ${lastValue.length} chars, Expected: ${expectedValue.length} chars)`
        );
    }

    /**
     * Validates input by checking if it exists and matches expected value
     * @param value The input value to validate
     * @param type The type of input being validated
     * @returns boolean True if validation passes
     */
    static validateInput(value: string, type: 'email' | 'password' | 'security-answer'): boolean {
        if (!value) {
            throw new ValidationError(`${type} is required`);
        }

        logger.info({
            inputValidation: {
                type,
                length: value.length
            }
        });

        switch (type) {
            case 'email': {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isValidEmail = emailRegex.test(value);
                if (!isValidEmail) {
                    throw new ValidationError('Invalid email format');
                }
                break;
            }

            case 'password': {
                const validations = {
                    minLength: value.length >= 8,
                    hasNumbers: /\d/.test(value),
                    hasLetters: /[a-zA-Z]/.test(value)
                };
                logger.info({ passwordValidation: validations });
                break;
            }

            case 'security-answer': {
                if (value.trim().length === 0) {
                    throw new ValidationError('Security answer cannot be empty');
                }
                break;
            }
        }

        return true;
    }
}

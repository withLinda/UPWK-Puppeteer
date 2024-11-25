import { Page, ElementHandle } from 'puppeteer';
import { delay, getRandomDelayFromTuple } from '../utils/delay';
import { TIMING, INPUT_CONFIG } from '../config';
import { InputError } from '../utils/errors';
import { DelayTuple } from '../config/types';

export interface InputOptions {
    preTypeDelay?: DelayTuple;
    postTypeDelay?: DelayTuple;
    maxAttempts?: number;
    isPassword?: boolean;
}

export class InputService {
    constructor(private page: Page) { }

    async moveMouseNaturally(element: ElementHandle): Promise<void> {
        try {
            const box = await element.boundingBox();
            if (!box) {
                throw new InputError('Failed to get element bounding box');
            }

            const targetX = box.x + box.width / 2 + Math.random() * 20 - 10;
            const targetY = box.y + box.height / 2 + Math.random() * 10 - 5;

            const steps = Math.floor(Math.random() * 5) + 5;
            await this.page.mouse.move(targetX, targetY, { steps });
            await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));
        } catch (error) {
            throw new InputError(
                `Failed to move mouse: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async typeNaturally(text: string, isPassword: boolean = false): Promise<void> {
        try {
            console.log(`Starting to type ${isPassword ? "password" : "text"}...`);

            for (const char of text) {
                await this.page.keyboard.type(char);

                const delayRange = !isPassword && (char === "@" || char === ".")
                    ? TIMING.DELAYS.TYPE.SPECIAL_CHAR
                    : TIMING.DELAYS.TYPE.NORMAL_CHAR;

                await delay(getRandomDelayFromTuple(delayRange));
            }

            console.log("Typing complete, waiting for input to settle...");
            await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
        } catch (error) {
            throw new InputError(
                `Failed to type text: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async verifyInputValue(
        selector: string,
        expectedValue: string,
        timeout: number = INPUT_CONFIG.VERIFICATION_TIMEOUT
    ): Promise<boolean> {
        const startTime = Date.now();
        let lastValue = "";

        while (Date.now() - startTime < timeout) {
            const currentValue = await this.page.evaluate((sel: string): string => {
                const input = document.querySelector(sel) as HTMLInputElement | null;
                return input ? input.value : "";
            }, selector);

            if (currentValue === expectedValue) {
                return true;
            }

            if (currentValue !== lastValue) {
                console.log("Current input value:", currentValue);
                lastValue = currentValue;
            }

            await delay(100);
        }

        return false;
    }

    async verifyCheckboxState(
        selector: string,
        expectedState: boolean = true,
        timeout: number = INPUT_CONFIG.VERIFICATION_TIMEOUT
    ): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const isChecked = await this.page.evaluate((sel: string): boolean => {
                const checkbox = document.querySelector(sel) as HTMLInputElement | null;
                return checkbox ? checkbox.checked : false;
            }, selector);

            if (isChecked === expectedState) {
                console.log(`Checkbox state verified: ${isChecked}`);
                return true;
            }

            await delay(100);
        }

        console.log(`Failed to verify checkbox state. Expected: ${expectedState}, Actual: ${await this.page.evaluate((sel: string): boolean => {
            const checkbox = document.querySelector(sel) as HTMLInputElement | null;
            return checkbox ? checkbox.checked : false;
        }, selector)}`);
        return false;
    }

    async handleCheckbox(selector: string, expectedState: boolean = true): Promise<boolean> {
        try {
            const checkbox = await this.page.waitForSelector(selector, {
                visible: true,
                timeout: TIMING.ELEMENT_WAIT_TIMEOUT,
            });

            if (!checkbox) {
                throw new InputError('Checkbox element not found');
            }

            const currentState = await this.page.evaluate((sel: string): boolean => {
                const element = document.querySelector(sel) as HTMLInputElement | null;
                return element ? element.checked : false;
            }, selector);

            if (currentState !== expectedState) {
                await this.moveMouseNaturally(checkbox);
                await this.page.click(selector);
                await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));
            }

            const isVerified = await this.verifyCheckboxState(selector, expectedState);
            if (!isVerified) {
                throw new InputError('Failed to verify checkbox state after clicking');
            }

            return true;
        } catch (error) {
            throw new InputError(
                `Failed to handle checkbox: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async handleInput(
        selector: string,
        value: string,
        options: InputOptions = {}
    ): Promise<boolean> {
        const {
            preTypeDelay = TIMING.DELAYS.MEDIUM,
            postTypeDelay = TIMING.DELAYS.MEDIUM,
            maxAttempts = INPUT_CONFIG.MAX_ATTEMPTS,
            isPassword = false
        } = options;

        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                const element = await this.page.waitForSelector(selector, {
                    visible: true,
                    timeout: TIMING.ELEMENT_WAIT_TIMEOUT,
                });

                if (!element) {
                    throw new InputError('Input element not found');
                }

                // Clear the field
                await this.page.evaluate((sel: string): void => {
                    const input = document.querySelector(sel) as HTMLInputElement | null;
                    if (input) {
                        input.value = "";
                        input.dispatchEvent(new Event("input", { bubbles: true }));
                    }
                }, selector);

                await delay(getRandomDelayFromTuple(preTypeDelay));
                await this.moveMouseNaturally(element);
                await this.page.click(selector);
                await delay(getRandomDelayFromTuple(TIMING.DELAYS.SHORT));

                await this.typeNaturally(value, isPassword);
                const isValueSet = await this.verifyInputValue(selector, value);

                if (!isValueSet) {
                    console.log(`${isPassword ? 'Password' : 'Input'} verification failed. Using fallback...`);

                    // Fallback method
                    await this.page.evaluate(
                        (sel: string, text: string): void => {
                            const input = document.querySelector(sel) as HTMLInputElement | null;
                            if (input) {
                                input.value = text;
                                input.dispatchEvent(new Event("input", { bubbles: true }));
                                input.dispatchEvent(new Event("change", { bubbles: true }));
                            }
                        },
                        selector,
                        value
                    );

                    await delay(1000);

                    const finalValue = await this.page.evaluate((sel: string): string => {
                        const input = document.querySelector(sel) as HTMLInputElement | null;
                        return input ? input.value : "";
                    }, selector);

                    if (finalValue === value) {
                        return true;
                    }
                } else {
                    return true;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    console.log(`Retrying input... (Attempt ${attempts + 1}/${maxAttempts})`);
                    await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
                }
            } catch (error) {
                console.error(
                    `Error handling input field (Attempt ${attempts + 1}):`,
                    error instanceof Error ? error.message : String(error)
                );
                attempts++;

                if (attempts >= maxAttempts) {
                    throw new InputError(
                        `Failed to handle input after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`
                    );
                }

                await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
            }
        }

        throw new InputError(`Failed to verify input after ${maxAttempts} attempts`);
    }

    async fillForm(formData: { selector: string; value: string; isPassword?: boolean }[]): Promise<boolean> {
        for (const { selector, value, isPassword } of formData) {
            try {
                await this.handleInput(selector, value, { isPassword });
            } catch (error) {
                throw new InputError(
                    `Failed to fill form field ${selector}: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }
        return true;
    }
}

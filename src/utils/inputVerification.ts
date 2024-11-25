import { Page, ElementHandle } from 'puppeteer';
import { delay, randomDelay } from './delay';
import {
    moveMouseInNaturalWay,
    typeWithNaturalSpeed,
    waitForInputValue,
} from './input';

interface InputOptions {
    preTypeDelay?: [number, number];
    postTypeDelay?: [number, number];
    maxAttempts?: number;
    isPassword?: boolean;
}

export async function handleInputField(
    page: Page,
    selector: string,
    value: string,
    options: InputOptions = {}
): Promise<boolean> {
    const {
        preTypeDelay = [800, 1500],
        postTypeDelay = [1000, 2000],
        maxAttempts = 3,
        isPassword = false
    } = options;

    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            // Wait for the input element
            const element = await page.waitForSelector(selector, {
                visible: true,
                timeout: 10000,
            });

            if (!element) {
                throw new Error('Input element not found');
            }

            // Clear the input field
            await page.evaluate((sel: string): void => {
                const input = document.querySelector(sel) as HTMLInputElement | null;
                if (input) {
                    input.value = "";
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                }
            }, selector);

            // Pre-type delay
            await delay(randomDelay(...preTypeDelay));

            // Move mouse and click
            await moveMouseInNaturalWay(page, element);
            await page.click(selector);
            await delay(randomDelay(300, 600));

            // Type the value
            await typeWithNaturalSpeed(page, value, isPassword);

            // Verify input value
            const isValueSet = await waitForInputValue(page, selector, value, 10000);

            if (!isValueSet) {
                console.log(`${isPassword ? 'Password' : 'Input'} verification failed. Using fallback method...`);

                // Fallback method
                await page.evaluate(
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

                // Verify one last time
                const finalValue = await page.evaluate((sel: string): string => {
                    const input = document.querySelector(sel) as HTMLInputElement | null;
                    return input ? input.value : "";
                }, selector);

                if (isPassword) {
                    console.log(
                        "Final password value after fallback:",
                        "*".repeat(finalValue.length)
                    );
                } else {
                    console.log("Final input value after fallback:", finalValue);
                }

                if (finalValue === value) {
                    return true;
                }
            } else {
                return true;
            }

            attempts++;
            if (attempts < maxAttempts) {
                console.log(
                    `Retrying input... (Attempt ${attempts + 1}/${maxAttempts})`
                );
                await delay(2000);
            }
        } catch (error) {
            console.error(
                `Error handling input field (Attempt ${attempts + 1}):`,
                error instanceof Error ? error.message : String(error)
            );
            attempts++;

            if (attempts >= maxAttempts) {
                throw new Error(
                    `Failed to handle input after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`
                );
            }

            await delay(2000);
        }
    }

    throw new Error(`Failed to verify input after ${maxAttempts} attempts`);
}

export async function handleEmailInput(
    page: Page,
    selector: string,
    value: string,
    options: InputOptions = {}
): Promise<boolean> {
    return handleInputField(page, selector, value, {
        ...options,
        isPassword: false
    });
}

export async function handlePasswordInput(
    page: Page,
    selector: string,
    value: string,
    options: InputOptions = {}
): Promise<boolean> {
    return handleInputField(page, selector, value, {
        ...options,
        isPassword: true
    });
}

export { waitForInputValue };

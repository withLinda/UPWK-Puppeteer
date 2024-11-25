import { Page, ElementHandle } from 'puppeteer';
import { delay, randomDelay } from './delay';

export const moveMouseInNaturalWay = async (
    page: Page,
    element: ElementHandle
): Promise<void> => {
    const box = await element.boundingBox();
    if (!box) return;

    const targetX = box.x + box.width / 2 + randomDelay(-10, 10);
    const targetY = box.y + box.height / 2 + randomDelay(-5, 5);

    const steps = randomDelay(5, 10);
    await page.mouse.move(targetX, targetY, { steps });
    await delay(randomDelay(50, 150));
};

export const waitForInputValue = async (
    page: Page,
    selector: string,
    expectedValue: string,
    timeout: number = 10000
): Promise<boolean> => {
    const startTime = Date.now();
    let lastValue = "";

    while (Date.now() - startTime < timeout) {
        const currentValue = await page.evaluate((sel: string): string => {
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
};

export const typeWithNaturalSpeed = async (
    page: Page,
    text: string,
    isPassword: boolean = false
): Promise<void> => {
    console.log(`Starting to type ${isPassword ? "password" : "text"}...`);

    for (const char of text) {
        await page.keyboard.type(char);

        if (!isPassword && (char === "@" || char === ".")) {
            await delay(randomDelay(400, 800));
        } else {
            await delay(randomDelay(100, 200));
        }
    }

    console.log("Typing complete, waiting for input to settle...");
    await delay(randomDelay(1000, 2000));
};

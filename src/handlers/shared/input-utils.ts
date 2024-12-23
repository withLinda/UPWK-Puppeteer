import { Page, ElementHandle } from 'puppeteer';
import { delay, getRandomDelayFromTuple } from '../../utils/delay';
import { TIMING } from '../../config';
import { logger } from '../../utils/logger';

/**
 * Moves the mouse to an element in a natural way
 */
export async function moveMouseNaturally(
    page: Page,
    element: ElementHandle<Element>
): Promise<void> {
    const box = await element.boundingBox();
    if (!box) return;

    const { x, y, width, height } = box;
    const targetX = x + width / 2;
    const targetY = y + height / 2;

    // Start from current viewport center as default position
    const currentPosition = await page.evaluate(() => {
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
    });

    logger.info({
        mouseMovement: {
            from: currentPosition,
            to: { x: targetX, y: targetY },
            elementBox: box
        }
    });

    await page.mouse.move(targetX, targetY, {
        steps: Math.floor(Math.random() * 5) + 5
    });
}

/**
 * Types text in a natural way with random delays between keystrokes
 */
export async function typeNaturally(
    page: Page,
    text: string,
    isPassword: boolean = false
): Promise<void> {
    logger.info({
        typing: {
            length: text.length,
            isPassword
        }
    });

    for (const char of text) {
        const isSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(char);
        const delay = getRandomDelayFromTuple(
            isSpecial ? TIMING.DELAYS.TYPE.SPECIAL_CHAR : TIMING.DELAYS.TYPE.NORMAL_CHAR
        );
        await page.keyboard.type(char, { delay });
    }

    logger.info('Typing complete');
    await delay(getRandomDelayFromTuple(TIMING.DELAYS.MEDIUM));
}

/**
 * Generates a unique selector for an element
 */
export function generateUniqueSelector(element: Element): string | null {
    // Try ID
    if (element.id) {
        return `#${element.id}`;
    }

    // Try unique class combination
    const classes = Array.from(element.classList);
    if (classes.length > 0) {
        const selector = `.${classes.join('.')}`;
        if (document.querySelectorAll(selector).length === 1) {
            return selector;
        }
    }

    // Try data attributes
    const attributes = Array.from(element.attributes);
    for (const attr of attributes) {
        if (attr.name.startsWith('data-')) {
            const selector = `[${attr.name}="${attr.value}"]`;
            if (document.querySelectorAll(selector).length === 1) {
                return selector;
            }
        }
    }

    // Try nth-child
    const parent = element.parentElement;
    if (parent) {
        const index = Array.from(parent.children).indexOf(element) + 1;
        const selector = `${parent.tagName.toLowerCase()} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
        if (document.querySelectorAll(selector).length === 1) {
            return selector;
        }
    }

    return null;
}

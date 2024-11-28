import { Page, ElementHandle } from 'puppeteer';
/**
 * Moves the mouse to an element in a natural way
 */
export declare function moveMouseNaturally(page: Page, element: ElementHandle<Element>): Promise<void>;
/**
 * Types text in a natural way with random delays between keystrokes
 */
export declare function typeNaturally(page: Page, text: string, isPassword?: boolean): Promise<void>;
/**
 * Generates a unique selector for an element
 */
export declare function generateUniqueSelector(element: Element): string | null;

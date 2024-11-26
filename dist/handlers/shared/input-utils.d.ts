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
/**
 * Checks if an element is visible and interactable
 */
export declare function isElementInteractable(element: Element): boolean;
/**
 * Gets detailed state information about an element
 */
export declare function getElementState(element: Element): {
    tagName: string;
    id: string;
    classes: string[];
    attributes: {
        name: string;
        value: string;
    }[];
    position: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
    styles: {
        display: string;
        visibility: string;
        opacity: string;
        pointerEvents: string;
        zIndex: string;
    };
    state: {
        isVisible: boolean;
        isInteractable: boolean;
        hasSize: boolean;
    };
};

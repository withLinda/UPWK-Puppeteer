import { Page, ElementHandle } from 'puppeteer';
export declare const moveMouseInNaturalWay: (page: Page, element: ElementHandle) => Promise<void>;
export declare const waitForInputValue: (page: Page, selector: string, expectedValue: string, timeout?: number) => Promise<boolean>;
export declare const typeWithNaturalSpeed: (page: Page, text: string, isPassword?: boolean) => Promise<void>;

import { Page } from 'puppeteer';
export interface ButtonOptions {
    preClickDelay?: [number, number];
    postClickDelay?: [number, number];
    waitForNavigation?: boolean;
    requiresFormValidation?: boolean;
}
export declare function handleButton(page: Page, selector: string, options?: ButtonOptions): Promise<boolean>;

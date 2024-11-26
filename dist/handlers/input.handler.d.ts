import { Page } from 'puppeteer';
export interface InputOptions {
    isPassword?: boolean;
    preTypeDelay?: [number, number];
    postTypeDelay?: [number, number];
}
export declare function handleInput(page: Page, selector: string, value: string, options?: InputOptions): Promise<boolean>;
export declare function fillForm(page: Page, formData: Array<{
    selector: string;
    value: string;
    isPassword?: boolean;
}>): Promise<boolean>;

import { Page } from 'puppeteer';
import { waitForInputValue } from './input';
interface InputOptions {
    preTypeDelay?: [number, number];
    postTypeDelay?: [number, number];
    maxAttempts?: number;
    isPassword?: boolean;
}
export declare function handleInputField(page: Page, selector: string, value: string, options?: InputOptions): Promise<boolean>;
export declare function handleEmailInput(page: Page, selector: string, value: string, options?: InputOptions): Promise<boolean>;
export declare function handlePasswordInput(page: Page, selector: string, value: string, options?: InputOptions): Promise<boolean>;
export { waitForInputValue };

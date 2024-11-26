import { Page } from 'puppeteer';
export declare function handleCheckbox(page: Page, selector: string, expectedState: boolean): Promise<boolean>;

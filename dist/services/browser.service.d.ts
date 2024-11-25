import { Page } from 'puppeteer';
export declare class BrowserService {
    private browser;
    private page;
    initialize(): Promise<Page>;
    navigateTo(url: string): Promise<void>;
    takeScreenshot(path: string): Promise<void>;
    cleanup(): Promise<void>;
    getPage(): Page;
}

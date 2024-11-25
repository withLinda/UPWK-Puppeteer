import { PuppeteerLaunchOptions } from 'puppeteer';
export declare const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
interface CustomBrowserConfig extends PuppeteerLaunchOptions {
    turnstile?: boolean;
    disableXvfb?: boolean;
    connectOption?: {
        defaultViewport: null;
    };
}
export declare const browserConfig: CustomBrowserConfig;
export {};

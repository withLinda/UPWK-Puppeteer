import { PuppeteerLaunchOptions } from 'puppeteer';

export const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

interface CustomBrowserConfig extends PuppeteerLaunchOptions {
    turnstile?: boolean;
    disableXvfb?: boolean;
    connectOption?: {
        defaultViewport: null;
    };
}

export const browserConfig: CustomBrowserConfig = {
    executablePath: chromePath,
    headless: false,
    turnstile: true,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
    disableXvfb: true,
    connectOption: {
        defaultViewport: null,
    },
};

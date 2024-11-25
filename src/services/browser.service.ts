import { Browser, Page } from 'puppeteer';
import puppeteerReal from 'puppeteer-real-browser';
import fs from 'fs';
import { CHROME_PATH, BROWSER_CONFIG } from '../config';
import { BrowserError } from '../utils/errors';

export class BrowserService {
    private browser: Browser | null = null;
    private page: Page | null = null;

    async initialize(): Promise<Page> {
        if (!fs.existsSync(CHROME_PATH)) {
            throw new BrowserError("Chrome executable not found at the specified path");
        }

        try {
            const result = await puppeteerReal.connect(BROWSER_CONFIG as any);
            this.browser = result.browser as unknown as Browser;
            this.page = result.page as unknown as Page;

            if (!this.page) {
                throw new BrowserError('Failed to initialize page');
            }

            // Set viewport to match window size
            await this.page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });

            return this.page;
        } catch (error) {
            throw new BrowserError(
                `Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async navigateTo(url: string): Promise<void> {
        if (!this.page) {
            throw new BrowserError('Browser page not initialized');
        }

        try {
            await this.page.goto(url, {
                waitUntil: ["domcontentloaded", "networkidle0"],
                timeout: 30000,
            });
        } catch (error) {
            throw new BrowserError(
                `Navigation failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async takeScreenshot(path: string): Promise<void> {
        if (!this.page) {
            throw new BrowserError('Browser page not initialized');
        }

        try {
            await this.page.screenshot({ path });
        } catch (error) {
            throw new BrowserError(
                `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            try {
                await this.browser.close();
            } catch (error) {
                console.error(
                    "Error closing browser:",
                    error instanceof Error ? error.message : String(error)
                );
            } finally {
                this.browser = null;
                this.page = null;
            }
        }
    }

    getPage(): Page {
        if (!this.page) {
            throw new BrowserError('Browser page not initialized');
        }
        return this.page;
    }
}

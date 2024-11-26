import { Browser, Page } from 'puppeteer';
import puppeteerReal from 'puppeteer-real-browser';
import fs from 'fs';
import { CHROME_PATH, BROWSER_CONFIG } from '../config';
import { BrowserError } from '../utils/errors';
import { logger } from '../utils/logger';

export class BrowserService {
    private browser: Browser | null = null;
    private page: Page | null = null;

    async initialize(): Promise<Page> {
        logger.info('=== Starting Browser Initialization ===');
        logger.info(`Checking Chrome executable at: ${CHROME_PATH}`);

        if (!fs.existsSync(CHROME_PATH)) {
            throw new BrowserError("Chrome executable not found at the specified path");
        }

        try {
            logger.info({ config: BROWSER_CONFIG });
            const result = await puppeteerReal.connect(BROWSER_CONFIG as any);
            this.browser = result.browser as unknown as Browser;
            this.page = result.page as unknown as Page;

            if (!this.browser || !this.page) {
                throw new BrowserError('Failed to initialize browser or page');
            }

            const version = await this.browser.version();
            logger.info(`Browser version: ${version}`);

            await this.page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });

            const metrics = await this.page.metrics();
            logger.info({ metrics });

            this.page.on('error', error => logger.error(error));
            this.page.on('pageerror', error => logger.error(error));
            this.page.on('console', msg => logger.info(`Console ${msg.type()}: ${msg.text()}`));

            logger.info('Browser initialization completed');
            return this.page;
        } catch (error) {
            logger.error(error);
            throw new BrowserError(
                `Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async navigateTo(url: string): Promise<void> {
        logger.info(`Navigating to: ${url}`);

        if (!this.page) {
            throw new BrowserError('Browser page not initialized');
        }

        try {
            const startTime = Date.now();
            await this.page.goto(url, {
                waitUntil: ["domcontentloaded", "networkidle0"],
                timeout: 30000,
            });
            const navigationTime = Date.now() - startTime;

            logger.info({
                navigationComplete: {
                    timeTaken: `${navigationTime}ms`,
                    finalUrl: this.page.url()
                }
            });

            const metrics = await this.page.metrics();
            logger.info({ metrics });

            const failedResources = await this.page.evaluate(() => {
                const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
                return resources
                    .filter(resource => !resource.responseEnd)
                    .map(resource => ({
                        name: resource.name,
                        duration: resource.duration,
                        type: resource.initiatorType
                    }));
            });

            if (failedResources.length > 0) {
                logger.warn({ failedResources });
            }
        } catch (error) {
            logger.error(error);
            if (this.page) {
                const metrics = await this.page.metrics();
                logger.info({ metricsAtError: metrics });
            }
            throw new BrowserError(
                `Navigation failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async takeScreenshot(path: string): Promise<void> {
        logger.info(`Taking screenshot: ${path}`);

        if (!this.page) {
            throw new BrowserError('Browser page not initialized');
        }

        try {
            const dimensions = await this.page.evaluate(() => ({
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }));
            logger.info({ dimensions });

            await this.page.screenshot({ path });

            if (fs.existsSync(path)) {
                const stats = fs.statSync(path);
                logger.info({
                    screenshot: {
                        size: `${stats.size} bytes`,
                        created: stats.birthtime
                    }
                });
            } else {
                throw new Error('Screenshot file not found after capture');
            }
        } catch (error) {
            logger.error(error);
            throw new BrowserError(
                `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async cleanup(): Promise<void> {
        logger.info('Starting browser cleanup');

        if (this.browser) {
            try {
                if (this.page) {
                    const metrics = await this.page.metrics();
                    logger.info({ finalMetrics: metrics });
                }

                await this.browser.close();
                this.browser = null;
                this.page = null;
                logger.info('Browser cleanup completed');
            } catch (error) {
                logger.error(error);
                throw error;
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
